import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    // Check if token is provided in the Authorization header

    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined in .env file');
        return res.status(500).json({ message: 'Server configuration error' });
    }
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Verify the token and attach only user ID to req.user
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.id;  // Attach only user ID to req.user
        next();                  // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

export { verifyToken };