const jwt = require('jsonwebtoken');

module.exports = (roles = []) => {
    return (req, res, next) => {
        const token = req.headers['authorization']?.split(' ')[1]; // Expecting "Bearer <token>"

        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;

            console.log("DECODED TOKEN:", decoded);

            // Check if user has the required role
            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
            }

            next();
        } catch (err) {
            return res.status(401).json({ message: "Invalid token" });
        }
    };
};