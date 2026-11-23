import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated. Please log in.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      // Clear invalid cookie
      res.clearCookie('token');
      return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
    }

    const user = await User.findById(decoded.userId).select('-__v');
    if (!user) {
      res.clearCookie('token');
      return res.status(401).json({ error: 'User account not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
