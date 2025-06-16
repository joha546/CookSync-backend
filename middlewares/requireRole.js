const requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.user.role !== role) {
    return res.status(403).json({ error: `Access denied. Only ${role}s allowed.` });
  }

  next();
};

module.exports = requireRole;
