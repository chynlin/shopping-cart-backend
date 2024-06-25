const jwt = require('jsonwebtoken');

// 这应该是你的密钥
const secretKey =
  '4ff8f0e441e5f989f318bcd7b37ce40d1bf3d0daf106fb844f1729ef6c6f8db5cdf3d108dea498327d65435e53e9339b5c182f93c497cad8c1fb5ad5aa2d6a0c';

module.exports = function (req, res, next) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), secretKey);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(400).json({ message: 'Token is not valid' });
  }
};
