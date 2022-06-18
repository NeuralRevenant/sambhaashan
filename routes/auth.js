const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');
const isAuth = require('../middleware/is_auth');
const isLoggedIn = require('../middleware/is_loggedin');
const authController = require('../controllers/auth');

const router = express.Router();
//GET ROUTES
router.get('/login', isLoggedIn, authController.getLogin);

router.get('/signup', isLoggedIn, authController.getSignup);

router.get('/reset/:token', isLoggedIn, authController.getNewPassword);

router.get('/reset', isLoggedIn, authController.getReset);


//POST ROUTES
router.post('/logout', isAuth, authController.postLogout);

router.post('/login', isLoggedIn, [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email!')
        .normalizeEmail()
        .custom((value, { req }) => {
            return User.findOne({ email: value }).then(user => {
                if (!user) {
                    return Promise.reject('No such user with the given email!');
                }
            });
        })
], authController.postLogin);

router.post('/signup', isLoggedIn, [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email!')
        .normalizeEmail()
        .custom((value, { req }) => {
            return User.findOne({ email: value }).then(user => {
                if (user) {
                    return Promise.reject('User with given email already exists!');
                }
            });
        }),
    body('username')
        .trim()
        .isLength({ min: 1, max: 25 })
        .withMessage('Enter a valid username (length between 1 & 25)'),
    body('password')
        .trim()
        .isLength({ min: 8, max: 30 })
        .withMessage('Password\'s strength should be between 8 & 30')
        .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1, returnScore: false })
        .withMessage('Not a strong Password! Password should contain atleast 1 uppercase letter, 1 lowercase letter, 1 number & 1 symbol'),
    body('confirmPassword')
        .trim()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Enter same password in both the fields!');
            }
            return true; //no error
        }),
    body('secretQuestion')
        .trim()
        .isLength({ min: 10, max: 60 })
        .withMessage('Enter a valid question (length : 10 - 60)'),
    body('answer')
        .trim()
        .isLength({ min: 8, max: 30 })
        .withMessage('Please enter an answer (length : 8 - 30)')
], authController.postSignup);

router.post('/reset', isLoggedIn, [
    body('email')
        .isEmail()
        .withMessage('Not a valid email id!')
        .normalizeEmail()
        .custom((value, { req }) => {
            return User.findOne({ email: value }).then(user => {
                if (!user) {
                    return Promise.reject('User not found. Enter an existing email!');
                }
            });
        })
], authController.postReset);

router.post('/new-password', isLoggedIn, [
    body('password')
        .trim()
        .isLength({ min: 8, max: 30 })
        .withMessage('Required Password Strength is between 8-30')
        .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1, returnScore: false })
        .withMessage('Not a strong Password! Password should contain atleast 1 uppercase letter, 1 lowercase letter, 1 number & 1 symbol')
], authController.postNewPassword);

module.exports = router;