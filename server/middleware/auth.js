// Validate every request with the shared API key and actor identity.
// Protected routes require x-api-key and x-actor headers.
module.exports = function requireApiKey(req, res, next) {
  const key = req.header('x-api-key');

  if (!process.env.API_KEY) {
    return res.status(500).json({
      success: false,
      error: 'System configuration error. Please contact support to set up the system access key.',
    });
  }

  if (!key || key !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing access code. Please check your key and try again.'
    });
  }

  req.actor = (req.header('x-actor') || '').trim() || 'unknown';
  next();
};