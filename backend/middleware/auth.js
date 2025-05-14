import { verifyAccessToken } from '../utils/jwtUtils.js';

// Middleware to verify user is authenticated
export const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false, 
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Attach user to request object
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Authentication failed.'
    });
  }
};

// Middleware to verify user is an admin
export const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin rights required.'
    });
  }
  
  next();
};

// Middleware to verify user is the author or an admin
export const authorizeAuthorOrAdmin = async (req, res, next) => {
  // Either the user is an admin or the user is the author of the resource
  // Implementation depends on the resource being accessed (e.g., blog post)
  // This will be implemented in each route as needed
  
  next();
};