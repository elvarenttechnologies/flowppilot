const { validationResult } = require('express-validator');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const generateToken = require('../utils/generateToken');

// POST /api/auth/signup
async function signup(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password, workspaceName } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    // Create the user first (without workspace) so we can reference it as owner,
    // then attach the workspace back to the user.
    const tempUser = new User({ name, email, password, role: 'owner', workspace: null });

    const workspace = await Workspace.create({
      name: workspaceName?.trim().slice(0, 80) || `${name.split(' ')[0]}'s Workspace`,
      owner: tempUser._id,
    });

    tempUser.workspace = workspace._id;

    try {
      await tempUser.save();
    } catch (saveErr) {
      // The workspace was created but the user failed to save (e.g. a race
      // where the same email was registered a split second earlier). Don't
      // leave an orphaned workspace with no owner behind.
      await Workspace.findByIdAndDelete(workspace._id).catch(() => {});
      throw saveErr;
    }

    const token = generateToken(res, tempUser._id);

    res.status(201).json({
      token,
      user: {
        id: tempUser._id,
        name: tempUser.name,
        email: tempUser.email,
        role: tempUser.role,
      },
      workspace: {
        id: workspace._id,
        name: workspace.name,
        plan: workspace.plan,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('workspace');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(res, user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      workspace: {
        id: user.workspace._id,
        name: user.workspace.name,
        plan: user.workspace.plan,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
function logout(req, res) {
  res.clearCookie('flowpilot_token');
  res.json({ message: 'Logged out.' });
}

// GET /api/auth/me
function me(req, res) {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
    workspace: {
      id: req.user.workspace._id,
      name: req.user.workspace.name,
      plan: req.user.workspace.plan,
    },
  });
}

module.exports = { signup, login, logout, me };
