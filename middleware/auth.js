const jwt = require('jsonwebtoken');

// 这应该是你的密钥
const secretKey =
  '58538bf828047b9a9a23249e54bfc0d0072dce4408dbcefd87460eb97587de7d009a127aa784404591a16c1d4465d84f74058c77b51da63c5c0af4416c16be0e';

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
