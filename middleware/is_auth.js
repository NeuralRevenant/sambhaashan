const crypto = require('crypto');

module.exports = (req, res, next) => {
    // Session Check
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    // some verification code
    const cookieParse = '' + req.headers?.cookie;
    if (!cookieParse.includes(';')) {
        return req.session.destroy(err => {
            if (err) {
                throw new Error("Server crashed! Wait for some time and try again.");
            }
            return res.redirect('/login');
        });
    } else {
        const cookies = cookieParse.split(';').map(el => el.trim());
        const cookie = cookies.find(el => el.startsWith('ent')) ? cookies.find(el => el.startsWith('ent')).trim() : undefined;
        if (cookie) {
            const checkCookie = cookie.slice(6);
            const pass = "";
            const str1 = checkCookie.slice(0, checkCookie.indexOf('.'));
            const str2 = checkCookie.slice(checkCookie.lastIndexOf('.') + 1);
            const start = str1 ? +str1 : '';
            const end = str2 ? +str2 : '';
            if (typeof start !== 'number' || typeof end !== 'number') return res.render('error', {
                pageTitle: 'Error',
                path: '/error',
                isAuthenticated: false,
                errorMsg: 'Sorry! You are not allowed without valid credentials.'
            });
            const key = crypto.pbkdf2Sync(pass, '<salt>' + pass.slice(start, end), 65536, 64, 'sha512');
            const checkAgainst = "<config. code>";
            const isEqual = key.toString('base64') === checkAgainst;
            if (!isEqual) {
                return req.session.destroy(err => {
                    if (err) {
                        throw new Error("Server error! try again.");
                    }
                    return res.render('error', {
                        pageTitle: 'Error',
                        path: '/error',
                        isAuthenticated: false,
                        errorMsg: 'Sorry! You are not allowed without valid credentials.'
                    });
                });
            }
        } else {
            return req.session.destroy(err => {
                if (err) {
                    throw new Error("Server error! try again.");
                }
                return res.render('error', {
                    pageTitle: 'Error',
                    path: '/error',
                    isAuthenticated: false,
                    errorMsg: 'Sorry! You are not allowed without valid credentials.'
                });
            });
        }
    }
    next();
};