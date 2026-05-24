const authorize = (...roles) => {
    return (req, res, next) => {
        try {
            // USER ROLE
            const userRole = req.user.role;
            // CHECK ROLE
            if (!roles.includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden access",
                });
            }
            next();
        } catch (error) {
            next(error);

        };
    };
};

module.exports = authorize;