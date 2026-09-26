require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const automationRoutes = require('./routes/automationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// --- Fail fast if required env vars are missing/placeholder (better than a
//     confusing crash later, or worse, silently running insecurely) ---
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('replace_this')) {
  console.error('\n JWT_SECRET is missing or still has its placeholder value.');
  console.error('   Open backend/.env and set JWT_SECRET to a long random string.\n');
  process.exit(1);
}

const app = express();

// --- Trust the platform's reverse proxy (Render/Railway/Fly/Heroku all sit
//     behind one). Without this: express-rate-limit throws on the
//     X-Forwarded-For header, req.ip is wrong, and secure cookies/HTTPS
//     detection can misbehave. This is required for production deploys. ---
app.set('trust proxy', 1);

// --- Security & core middleware ---
app.use(
  helmet({
    contentSecurityPolicy: false, // keep off so the existing frontend's inline styles/fonts load cleanly
  })
);

const allowedOrigin = process.env.CLIENT_URL;
app.use(
  cors({
    // In production, only allow the configured CLIENT_URL (credentialed
    // cross-origin requests should never be reflected to "any origin").
    // In development, fall back to allowing any origin for convenience.
    origin: allowedOrigin || (process.env.NODE_ENV === 'production' ? false : true),
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// --- General API rate limiting (auth routes have their own, stricter limit) ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down and try again shortly.' },
});
app.use('/api', apiLimiter);

// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// --- Serve the frontend (landing page, login, signup, dashboard) ---
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

app.get('/', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));

// --- 404s ---
app.use('/api', notFound);
// Any other unmatched route (typo'd page, bad link, etc.) - send them home
// instead of Express's default bare-bones error page.
app.use((req, res) => res.status(404).sendFile(path.join(frontendPath, 'index.html')));

// --- Error handling (must be last) ---
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\nFlowPilot server running at http://localhost:${PORT}`);
    console.log(`Landing page:  http://localhost:${PORT}/`);
    console.log(`Login:         http://localhost:${PORT}/login.html`);
    console.log(`Sign up:       http://localhost:${PORT}/signup.html\n`);
  });
});

// --- Don't let one bad async error silently kill the process without a trace ---
process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});
