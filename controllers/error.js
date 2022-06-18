//404 Page

module.exports = (req, res, next) => {
  res.status(404).render('error', {
    pageTitle: 'Error',
    path: '/404',
    isAuthenticated: req.session.isLoggedIn || false,
    errorMsg: 'Page Not Found!'
  });
};
