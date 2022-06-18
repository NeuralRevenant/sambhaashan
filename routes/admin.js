const express = require('express');
const { body } = require("express-validator");

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is_auth');
const User = require('../models/user');

//util functions
const checkValidity = require('../util/check_validity');

const router = express.Router();

router.get('/add-post', isAuth, adminController.getAddPost);

router.get('/edit-post/:postId', isAuth, adminController.getEditPost);

router.get('/usernames-auto-complete', isAuth, adminController.getJSONUserNames);

router.get('/add-friend', isAuth, adminController.getAddFriend);

router.get('/requests', isAuth, adminController.getRequests);

router.get('/friends-auto-complete', isAuth, adminController.getJSONFriendsList);

router.get('/friends', isAuth, adminController.getFriends);

router.get('/send-messages', isAuth, adminController.getSendMessages);

router.get('/send-message/:userId', isAuth, adminController.getSendMessage);

router.get('/received-messages/:msgId', isAuth, adminController.getReceivedMessage);

router.get('/sent-messages/:msgId', isAuth, adminController.getSentMessage);

router.get('/received-messages-auto-complete', isAuth, adminController.getJSONReceivedMsgs);

router.get('/received-messages', isAuth, adminController.getReceivedMessages);

router.get('/sent-messages-auto-complete', isAuth, adminController.getJSONSentMsgs);

router.get('/sent-messages', isAuth, adminController.getSentMessages);

router.get('/settings', isAuth, adminController.getAdminSettings);

router.post('/add-post', isAuth, [
    body('title')
        .trim()
        .isLength({ min: 1, max: 25 })
        .withMessage("Make sure the title has (1-25) characters."),
    body('description')
        .trim()
        .isLength({ min: 1, max: 150 })
        .withMessage("The description should be between (1-150) characters.")
], adminController.postAddPost);

router.post('/edit-post', isAuth, [
    body('title')
        .trim()
        .isLength({ min: 1, max: 25 })
        .withMessage("Make sure the title has (1-25) characters."),
    body('description')
        .trim()
        .isLength({ min: 1, max: 150 })
        .withMessage("The description should be between (1-150) characters.")
], adminController.postEditPost);

router.post('/delete-post', isAuth, adminController.postDeletePost);

router.post('/add-friend', isAuth, [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email!')
        .normalizeEmail()
        .custom((value, { req }) => {
            return User.findOne({ email: value }).then(user => {
                if (!user) {
                    return Promise.reject("No user exists with the given email-id!");
                }
            });
        }),
    body('username')
        .custom((value, { req }) => {
            return User.findOne({ username: value }).then(user => {
                if (!user) {
                    return Promise.reject("No user exists with the given username!");
                }
            });
        })
], adminController.postAddFriend);

router.post('/delete-friend', isAuth, adminController.postDeleteFriend);

router.post('/accept-req', isAuth, adminController.postAcceptReq);

router.post('/delete-req', isAuth, adminController.deleteFriendReq);

router.post('/send-message', isAuth, [
    body('title')
        .trim()
        .isLength({ min: 1, max: 25 })
        .withMessage('Enter a title of length (1-25)'),
    body('message')
        .trim()
        .isLength({ min: 1, max: 150 })
        .withMessage('Message must be between (1-150) characters!')
], adminController.postSendMessage);

router.post('/delete-received-message', isAuth, adminController.deleteReceivedMessage);

router.post('/delete-sent-message', isAuth, adminController.deleteSentMessage);

router.post('/send-messages', isAuth, [
    body('emailIds')
        .custom((val, { req }) => {
            if (val.length === 0) {
                throw new Error("Please don't leave the email-ids field empty!");
            }
            let value = val;
            const emails = value.trim().split(",").map(c => c.trim());
            if (!checkValidity.isValidEmailString(emails.join(""))) {
                throw new Error("Seperate the emails with ',' or commas only and enter correct email-Ids");
            }
            if (checkValidity.hasDuplicateValue(emails)) {
                throw new Error("Please don't enter duplicates in email-Ids field.");
            }
            return User.findById(req.user._id).populate('friends.userId', '_id email').then(user => {
                const friends = [...user.friends.map(friend => friend.userId.email)];
                if (!checkValidity.isInFriendsList(friends, emails)) { // checking if the emails entered are actually friends of the current user
                    return Promise.reject("Enter valid email-Ids of your friends!");
                }
            });
        }),
    body('title')
        .trim()
        .isLength({ min: 1, max: 25 })
        .withMessage('Enter a title of length (1-25)'),
    body('message')
        .trim()
        .isLength({ min: 1, max: 150 })
        .withMessage('Message must be between (1-150) characters!')
], adminController.postSendMessages);

router.post('/settings', isAuth,
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email!')
            .normalizeEmail()
            .custom((val, { req }) => {
                return User.findOne({ email: val }).then(user => {
                    if (user && val !== req.user.email) {
                        return Promise.reject('User with given email already exists!');
                    }
                });
            }),
        body('username')
            .trim()
            .isLength({ min: 1, max: 25 })
            .withMessage('Enter a valid username (length: 1 - 25)'),
        body('password')
            .trim()
            .isLength({ min: 8, max: 30 })
            .withMessage('Required password\'s strength : 8 - 30')
            .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1, returnScore: false })
            .withMessage('Password should contain atleast 1 uppercase letter, 1 lowercase letter, 1 number & 1 symbol'),
        body('confirmPassword')
            .trim()
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Enter same password in both the fields');
                }
                return true;
            }),
        body('secretQuestion')
            .trim()
            .isLength({ min: 10, max: 60 })
            .withMessage('Enter a valid question (length : 10 - 60)'),
        body('answer')
            .trim()
            .isLength({ min: 8, max: 30 })
            .withMessage('Please enter an answer (length : 8 - 30)')
    ], adminController.postAdminSettings);

router.post('/clear-received-messages', isAuth, adminController.postClearReceivedMsgs);

router.post('/clear-sent-messages', isAuth, adminController.postClearSentMsgs);

router.post('/filter-friends', isAuth, adminController.getFilteredFriends);

router.post('/filter-received-messages', isAuth, adminController.getFilteredReceivedMsgs);

router.post('/filter-sent-messages', isAuth, adminController.getFilteredSentMsgs);


module.exports = router;