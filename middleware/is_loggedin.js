module.exports = (req, res, next) => {
    if (req.session.isLoggedIn) {
        return res.render('error', {
            pageTitle: 'Error',
            path: '/error',
            isAuthenticated: true,
            errorMsg: "Already logged in! Please logout first."
        });
    }
    next();
};