const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: process.env.AUTH_KEY
    }
}));

exports.getLogin = (req, res) => {
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMsg: null,
        oldData: {
            email: '',
            password: ''
        },
        validationErrors: []
    });
};

exports.postLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMsg: errors.array()[0].msg,
            oldData: {
                email: email,
                password: password
            },
            validationErrors: errors.array()
        });
    }

    User.findOne({ email: email }).then(user => {
        if (!user) {
            return res.render('auth/login', {
                path: '/login',
                pageTitle: 'Login',
                errorMsg: 'Invalid email or password!',
                oldData: {
                    email: email,
                    password: password
                },
                validationErrors: []
            });
        }
        bcrypt.compare(password, user.password).then(isEqual => {
            if (isEqual) {
                req.session.userId = user._id;
                req.session.isLoggedIn = true;
                req.session.save(err => {
                    if (err) {
                        throw new Error(err);
                    }
                    const pass = secret;
                    // const cookie = bcrypt.hashSync(pass);
                    // res.setHeader('Set-Cookie', `entry=${cookie};HttpOnly;Secure;SameSite=Strict;`);
                    const start = Math.floor(Math.random() * (pass.length / 5));
                    const end = Math.floor(start + Math.random() * (pass.length - start));
                    const key = crypto.pbkdf2Sync(pass, '<salt>' + pass.slice(start, end), 65536, 64, 'sha512');
                    res.setHeader('Set-Cookie', `entry=${start + '.' + key.toString('base64') + '.' + end};HttpOnly;Secure;SameSite=Strict;`);
                    res.redirect('/');
                });
            } else {
                res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMsg: 'Invalid email or password!',
                    oldData: {
                        email: email,
                        password: password
                    },
                    validationErrors: []
                });
            }
        });
    }).catch(() => {
        const error = new Error("Error! An error occurred.");
        next(error);
    });
};

exports.getSignup = (req, res) => {
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMsg: null,
        oldData: {
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationErrors: []
    });
};

exports.postSignup = (req, res, next) => {
    const { email, password, username, secretQuestion, answer } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMsg: errors.array()[0].msg,
            oldData: {
                email: email,
                username: username,
                password: password,
                confirmPassword: req.body.confirmPassword,
                secretQuestion: secretQuestion,
                answer: answer
            },
            validationErrors: errors.array()
        });
    }

    let hashedPassword;
    let ansKey;
    bcrypt.hash(password, 12).then(hashPassword => {
        hashedPassword = hashPassword;
        const key = crypto.randomBytes(32);
        const secretKey = crypto.createSecretKey(key);
        ansKey = key;
        const hmac = crypto.createHmac("sha512", secretKey);
        hmac.update(answer);
        return hmac.digest('base64');
    }).then(hashedAns => {
        const user = new User({
            email: email,
            password: hashedPassword,
            username: username,
            sentMsgs: [],
            receivedMsgs: [],
            friends: [],
            requests: [],
            isOnline: req.session.isLoggedIn || false,
            secretQuestion: secretQuestion,
            answer: hashedAns,
            key: ansKey
        });
        return user.save();
    }).then(() => {
        res.redirect('/login');
    }).catch(() => {
        next(new Error("Server-side error"));
    });
};

exports.postLogout = (req, res, next) => {
    req.user.isOnline = false;
    req.user.save().then(() => {
        req.session.destroy(err => {
            if (err) {
                throw new Error("error.");
            }
            res.redirect('/login');
        });
    }).catch(() => next(new Error("Error! Please try once again.")));
};

exports.getReset = (req, res) => {
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMsg: null,
        email: '',
        question: '',
        answer: ''
    });
};

// function changeBits(string) {
//     const arr = [];
//     for (const char of string) {
//         if (char == '/') continue;
//         let code = char.charCodeAt();
//         code = code ^ (crypto.randomInt(1, 248));
//         arr.push(code);
//     }
//     return arr.join('');
// }

exports.postReset = (req, res, next) => {
    const { email, question, answer } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(404).render('auth/reset', {
            pageTitle: 'Reset Password',
            path: '/reset',
            isAuthenticated: false,
            errorMsg: errors.array()[0].msg,
            email: email,
            question: question,
            answer: answer
        });
    }
    let currentUser;
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            return res.status(500).render('error', {
                pageTitle: 'Error',
                path: '/error',
                isAuthenticated: false,
                errorMsg: "An error occurred. Please try again!"
            });
        }
        const token = buffer.toString('hex');
        User.findOne({ email: email, secretQuestion: question }).then(user => {
            if (!user) {
                throw new Error("No user is found with the given data.");
            }
            currentUser = user;
            // return bcrypt.compare(answer, user.answer);
            const secretKey = crypto.createSecretKey(Buffer.from(user.key));
            const hmac = crypto.createHmac("sha512", secretKey);
            hmac.update(answer);
            return hmac.digest('base64') === user.answer;
        }).then(isEqual => {
            if (isEqual) {
                if (currentUser.nextAllowedPasswordReset && (currentUser.nextAllowedPasswordReset.getTime() >= new Date().getTime())) {
                    let nextTry = Math.round((currentUser.nextAllowedPasswordReset - new Date()) / 1000); // in secs now
                    if (nextTry < 1) { //if less than 1 sec
                        nextTry = 'a second';
                    } else if (nextTry < 60) { //less than 1 min
                        nextTry += ' seconds';
                    } else if (nextTry < 60 * 60) { //less than 1 hr
                        nextTry = Math.round(nextTry / 60) + ' mins';
                    } else { // >= 1 hr
                        nextTry = Math.round(nextTry / (60 * 60)) + ' hrs';
                    }
                    throw new Error(`You can only use the reset password option once every 24 hrs. Please try again in ${nextTry}.`);
                }
                currentUser.resetToken = token;
                currentUser.resetTokenExpiration = Date.now() + 10 * 60 * 1000;
                currentUser.nextAllowedPasswordReset = new Date(Date.now() + 24 * 60 * 60 * 1000);
                return currentUser.save();
            } else {
                throw new Error("No user is found with the given data.");
            }
        }).then(user => {
            currentUser = user;
            transporter.sendMail({
                to: req.body.email,
                from: `${process.env.SENDER_EMAIL}`,
                subject: 'Reset Password',
                html: `<div>
                        <p>Click this <a href="https://sambhaashan.herokuapp.com/reset/${token}">link</a> to set a new password. Link expires in 10 mins.</p>
                        <h3>Kindly ignore this messsage if it's not for you.</h3>
                        </div>`
            }).catch(() => {
                throw new Error("Error sending the email! Please try again later.");
            });
            return res.redirect('/login');
        }).catch(err => {
            if (currentUser?.resetToken || currentUser?.resetTokenExpiration) {
                (async function () {
                    currentUser.resetToken = undefined;
                    currentUser.resetTokenExpiration = undefined;
                    await currentUser.save();
                })();
            }
            if (err.message === "No user is found with the given data.") {
                return res.status(422).render('auth/reset', {
                    pageTitle: 'Reset Password',
                    path: '/reset',
                    isAuthenticated: false,
                    errorMsg: "No user is found with the given data.",
                    email: email,
                    question: question,
                    answer: answer
                })
            } else if (err.message.startsWith("You can only use")) {
                return next(err)
            }
            next(new Error("Error! Please try again."))
        });
    });
};

exports.getNewPassword = (req, res, next) -> {
    const token = req.params.token;
    // const answer = req.params.answer;
    if (!token) {
        return next(new Error("Invalid Info!"));
    }
    return User.findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: new Date() }
    }).then(user => {
        if (!user) {
            return res.render('error', {
                pageTitle: 'Error!',
                path: '/error',
                isAuthenticated: false,
                errorMsg: "Token expired or an invalid token! Try again."
            });
        }
        return res.render('auth/new-password', {
            path: '/new-password',
            pageTitle: 'Reset Password',
            userId: user._id.toString(),
            passwordToken: token,
            answer: user.answer,
            errorMsg: null
        });

        // return User.aggregate([
        //     {
        //         $match: {
        //             resetToken: token,
        //             resetTokenExpiration: { $gt: new Date() }
        //         }
        //     },
        //     {
        //         $project: {
        //             test: "$answer",
        //             answer: {
        //                 $reduce: {
        //                     input: {
        //                         $split: ["$answer", "/"]
        //                     },
        //                     initialValue: "",
        //                     in: {
        //                         $concat: ["$$value", "$$this"]
        //                     }
        //                 }
        //             },
        //             resetToken: true, //true or 1 can be used
        //             resetTokenExpiration: true
        //         }
        //     },
        //     {
        //         $match: {
        //             answer: answer
        //         }
        //     }
        // ])
    }).catch(() => next(new Error("An error occurred! Please try again.")));
};

exports.postNewPassword = (req, res, next) => {
    const { userId, password: newPassword, passwordToken: token, answer } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('auth/new-password', {
            path: '/new-password',
            pageTitle: 'Reset Password',
            userId: userId,
            passwordToken: token,
            answer: answer,
            errorMsg: errors.array()[0].msg
        });
    }

    let currentUser;
    User.findOne({
        _id: userId,
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() },
        answer: answer
    }).then(user => {
        if (!user) {
            throw new Error("Token expired or an error occurred!");
        }
        currentUser = user;
        return bcrypt.hash(newPassword, 12);
    }).then(hashPassword => {
        currentUser.password = hashPassword;
        currentUser.resetTokenExpiration = undefined;
        currentUser.resetToken = undefined;
        return currentUser.save();
    }).then(() => {
        res.redirect('/login');
    }).catch(err => {
        if (err.message === "Token expired or an error occurred!") {
            return next(new Error(err.message));
        }
        next(new Error("Error! Please try again."));
    });
};

