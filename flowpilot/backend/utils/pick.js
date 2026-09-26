// Returns a new object containing only the allowed keys from `obj`.
// Used on every update route so a client can never overwrite protected
// fields (workspace, _id, timestamps, run counters, etc.) by stuffing
// extra keys into a PUT body.
function pick(obj, allowedKeys) {
  const result = {};
  allowedKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  });
  return result;
}

module.exports = pick;
