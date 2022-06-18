const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const Post = require('../models/post');
const User = require('../models/user');
const deleteFile = require('../util/delete_file');
const filters = require('../util/filters');

exports.getAddPost = (req, res) => {
    res.render('admin/edit-post', {
        pageTitle: 'Add Post',
        path: '/admin/add-post',
        editing: false,
        errorMsg: null,
    });
};

exports.postAddPost = (req, res) => {
    const { title, description } = req.body;
    let filePath = undefined;
    let fileType = undefined;
    const file = req.file;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        deleteFile(file?.path || undefined); // delete if the data doesn't match requirements
        return res.render('admin/edit-post', {
            pageTitle: 'Add Post',
            path: '/admin/add-post',
            editing: false,
            post: {
                title: title,
                description: description
            },
            errorMsg: errors.array()[0].msg
        });
    }

    if (file) {
        filePath = file.path;
        fileType = file.mimetype;
    }
    const post = new Post({
        title: title,
        description: description,
        filePath: filePath,
        fileType: fileType,
        userId: req.user._id   //mongoose will extract the _id out of it or u can explicitly mention "._id" as well
    });

    post.save().then(() => {
        res.redirect('/');
    }).catch(() => {
        deleteFile(file?.path || undefined);
        return res.status(422).render('admin/edit-post', {
            pageTitle: 'Add Post',
            path: '/admin/add-post',
            editing: false,
            post: {
                title: title,
                description: description
            },
            errorMsg: "Error occurred! Please try again."
        });
    });
};

exports.getEditPost = (req, res, next) => {
    const canEdit = req.query.edit;
    if (!canEdit) {
        return res.redirect('/');
    }
    const postId = req.params.postId;
    Post.findOne({ _id: postId, userId: req.user._id }).then(post => {
        if (!post) {
            return next(new Error("Not Authorized!"));
        }
        res.render('admin/edit-post', {
            pageTitle: 'Edit Post',
            path: '/admin/edit-post',
            editing: canEdit,
            post: post,
            errorMsg: null
        });
    }).catch(() => next(new Error("Error! Please try again.")));
};

exports.postEditPost = (req, res, next) => {
    const { postId, title, description } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-post', {
            pageTitle: 'Edit Post',
            path: '/admin/edit-post',
            editing: true,
            post: {
                title: title,
                description: description,
                _id: postId
            },
            errorMsg: errors.array()[0].msg
        });
    }
    Post.findOne({ _id: postId, userId: req.user._id }).then(post => {
        if (!post) {
            return next(new Error("No Such Post!"));
        }
        post.title = title;
        post.description = description;
        if (req.file) { // if in edited version, there's a file
            if (post.filePath && post.fileType) { // and if already in the older version also there's a file
                deleteFile(post.filePath); // the delete older file & replace newer one
            }
            post.filePath = req.file.path; // replacing newer file-path/type
            post.fileType = req.file.mimetype;
        }
        return post.save();
    }).then(() => {
        res.redirect('/');
    }).catch(() => {
        return res.status(422).render('admin/edit-post', {
            pageTitle: 'Edit Post',
            path: '/admin/edit-post',
            editing: true,
            post: {
                title: title,
                description: description,
                _id: postId
            },
            errorMsg: "An error occurred! Please try again."
        });
    });
};

exports.postDeletePost = (req, res, next) => {
    const postId = req.body.postId;
    Post.findOneAndDelete({ _id: postId, userId: req.user._id }).then(post => {
        if (!post) {
            return next(new Error("No such post found!"));
        }
        deleteFile(post.filePath);
        res.redirect('/');
    }).catch(() => {
        next(new Error("An error occurred! please try again."));
    });
};

exports.getJSONFriendsList = (req, res, next) => {
    User.find({ _id: { $in: req.user.friends.map(friend => friend.userId) } }).select('username -_id').then(friends => {
        const list = friends.map(friend => friend.username);
        return res.json({
            message: 'Info fetched successfully',
            friends: list
        });
    }).catch(() => next(new Error("An error occurred!")));
};

exports.getFriends = (req, res, next) => {
    const ITEMS_PER_PG = 8;
    const page = req?.query?.page ? Number.parseInt(req.query.page) : 1;
    let count = req.user.friends.length;
    if ((page > Math.ceil(count / ITEMS_PER_PG)) && page > 1) {
        return next(new Error("Page does not exist! Please go to the first page."));
    }
    if (page < 1) {
        return next(new Error("Page does not exist! Please go to the first page."));
    }
    User.find({ _id: req.user.friends.map(friend => friend.userId) }).select('_id email username isOnline').skip((page - 1) * ITEMS_PER_PG).limit(ITEMS_PER_PG).then(friends => {
        res.render('admin/friends', {
            pageTitle: 'Friends',
            path: '/admin/friends',
            friends: friends,
            currentPage: page,
            hasNextPage: (page < Math.ceil(count / ITEMS_PER_PG)),
            hasPreviousPage: (page > 1),
            nextPage: page + 1,
            previousPage: page - 1,
            filter: false
        });
    }).catch(() => next(new Error("Error! Please reload & try again.")));
};

exports.getFilteredFriends = (req, res, next) => {
    let search = req.body.filter;
    const friendIds = [...req.user.friends.map(friend => friend.userId)];
    User.find({ _id: friendIds }).select('_id email username isOnline').then(friends => {
        if (!friends) {
            return res.redirect('/admin/friends');
        }
        let filteredFriends = [...friends];
        filteredFriends = filters.filterFriends(filteredFriends, search);
        return res.status(200).render('admin/friends', {
            pageTitle: 'Friends',
            path: '/admin/friends',
            friends: filteredFriends,
            filter: true
        });
    }).catch(() => next(new Error("Error! Please reload & try again.")));
};

// getting username auto-complete
exports.getJSONUserNames = (req, res, next) => {
    // Only fetch the usernames for auto-complete
    User.find().select('username -_id').then(users => {
        const usernames = users.map(user => user.username);
        return res.status(200).json({
            message: 'Info fetched successfully',
            usernames: usernames
        });
    }).catch(() => next(new Error("An error occurred!")));
};

exports.getAddFriend = (req, res) => {
    res.render('admin/add-friend', {
        pageTitle: 'Add Friend',
        path: '/admin/add-friend',
        email: '',
        username: '',
        errorMsg: null
    });
};

exports.postAddFriend = (req, res, next) => {
    const errors = validationResult(req);
    const { email, username } = req.body;
    if (!errors.isEmpty()) {
        return res.render('admin/add-friend', {
            pageTitle: 'Add Friend',
            path: '/admin/add-friend',
            email: email,
            username: username,
            errorMsg: errors.array()[0].msg
        });
    }

    User.findOne({ email: email, username: username }).select('_id email username friends requests').then(user => {
        return req.user.addRequest(user);
    }).then(() => {
        res.redirect('/admin/friends');
    }).catch(err => {
        if (err.message == "Already Sent a Request! You can't send a request twice.") {
            return next(new Error(err.message));
        }
        next(new Error("An error occurred! try again."));
    });
};

exports.postDeleteFriend = (req, res, next) => {
    let other;
    User.findOne({ _id: req.body.friendId }).select('_id email username friends requests').then(user => {
        if (!user) {
            return next(new Error("No such user!"));
        }
        other = user;
        return req.user.deleteFriend(user);
    }).then(() => {
        return other.deleteFriend(req.user);
    }).then(() => {
        res.redirect('/admin/friends');
    }).catch(err => {
        if (err.message == "You have no such friend!") {
            return next(new Error(err.message));
        }
        // next(new Error("An Error occurred! Please try again."));
        next(new Error("Error! try again."));
    });
};

exports.getRequests = (req, res, next) => {
    User.find({ _id: req.user.requests.map(user => user.userId) }).select('email username _id').then(users => {
        res.render('admin/requests', {
            pageTitle: 'Requests',
            path: '/admin/requests',
            requests: users,
            errorMsg: null
        });
    }).catch(() => next(new Error("An error occurred! Please try again.")));
};

exports.postAcceptReq = (req, res, next) => {//addingfriend
    let other;
    User.findOne({ _id: req.body.friendId }).select('_id email username friends requests').then(user => {
        if (!user) {
            return next(new Error("No such user!"));
        }
        other = user;
        return req.user.acceptRequest(user);
    }).then(() => {
        return other.addedFriend(req.user);
    }).then(() => {
        res.redirect('/admin/friends');
    }).catch(err => {
        if (err.message == "You can't add a friend twice!" || err.message == "No such user sent you a request!") {
            return next(new Error(err.message));
        }
        // next(new Error("An Error occurred! Please try again."));
        next(new Error("An error occurred! please try again!"));
    });

};

exports.deleteFriendReq = (req, res, next) => {
    User.findOne({ _id: req.body.friendId }).select('_id email username friends requests').then(user => {
        return req.user.deleteRequest(user);
    }).then(() => {
        res.redirect('/admin/requests');
    }).catch(err => {
        if (err.message == 'No such user sent you a request!' || err.message == "No requests at all!") {
            return next(new Error(err.message));
        }
        next(new Error("An error occurred! try again."));
    });
};
//messages
exports.getSendMessage = (req, res, next) => {
    const friendId = req.params.userId;
    User.findOne({ _id: friendId }).select('_id username').then(user => {
        if (!user) {
            throw new Error("No such user!");
        }
        res.render('admin/send-message', {
            path: '/admin/send-message',
            pageTitle: 'Message',
            username: user.username,
            userId: user._id,
            title: '',
            message: '',
            errorMsg: null
        });
    }).catch(err => {
        if (err.message === "No such user!") {
            return next(new Error(err.message));
        }
        next(new Error("An error occurred! try again."));
    });
};

exports.getSendMessages = (req, res) => { //toManyAtOnce
    res.render('admin/messaging-page', {
        path: '/admin/send-messages',
        pageTitle: 'Message',
        emailIds: '',
        title: '',
        message: '',
        errorMsg: null
    });
};

exports.postSendMessages = (req, res, next) => { //sendtoMany at once
    const { emailIds, title, message } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('admin/messaging-page', {
            path: '/admin/send-messages',
            pageTitle: 'Message',
            emailIds: emailIds,
            title: title,
            message: message,
            errorMsg: errors.array()[0].msg
        });
    }
    const emails = emailIds.trim().split(',').map(e => e.trim());
    User.find({ email: emails }).then(users => {
        req.user.sendMsgsToAll(users, title, message);
    }).then(() => {
        res.redirect('/admin/sent-messages');
    }).catch(() => next(new Error("Error! Please try again.")));
};

exports.postSendMessage = (req, res, next) => {
    const errors = validationResult(req);
    const { userId, title, message, username } = req.body;

    if (!errors.isEmpty()) {
        return res.render('admin/send-message', {
            path: '/admin/send-message',
            pageTitle: 'Message',
            username: username,
            userId: userId,
            title: title,
            message: message,
            errorMsg: errors.array()[0].msg
        });
    }
    User.findOne({ _id: userId }).then(user => {
        if (!user) {
            throw new Error("No such user!");
        }
        return user.receivedMessage(req.user, title, message);
    }).then(() => {
        res.redirect('/admin/sent-messages');
    }).catch(err => {
        if (err.message === "No such user!" || err.message === "No such user in your friend list!") {
            return next(new Error(err.message));
        }
        next(new Error("An error occurred! try again."));
    });
};

// JSON response of receivedMsgs required
exports.getJSONReceivedMsgs = (req, res) => {
    const msgs = req.user.receivedMsgs.map(msg => msg.message.title);
    return res.status(200).json({
        message: 'Info fetched successfully',
        messages: msgs
    });
};

exports.getReceivedMessages = (req, res, next) => {
    const ITEMS_PER_PG = 4;
    const page = req?.query?.page ? Number.parseInt(req.query.page) : 1;
    let count = req.user.receivedMsgs.length;
    if ((page > Math.ceil(count / ITEMS_PER_PG)) && (page > 1)) {
        return next(new Error("Page does not exist! Please go to the first page."));
    }
    if (page < 1) {
        return next(new Error("Page does not exist! Please go to the first page."));
    }
    User.findById(req.user._id).populate('receivedMsgs.fromId', '_id username isOnline').then(user => {
        res.render('admin/received-messages', {
            msgs: user.receivedMsgs.slice((page - 1) * ITEMS_PER_PG, page * ITEMS_PER_PG),
            pageTitle: 'Messages',
            path: '/admin/received-messages',
            currentPage: page,
            hasNextPage: (page < Math.ceil(count / ITEMS_PER_PG)),
            hasPreviousPage: (page > 1),
            nextPage: page + 1,
            previousPage: page - 1,
            filter: false
        });
    }).catch(() => next(new Error("ERROR! Please try again.")));
};

exports.getFilteredReceivedMsgs = (req, res, next) => {
    let search = req.body.filter;
    User.findById(req.user._id).populate('receivedMsgs.fromId', '_id username isOnline').then(user => {
        let filteredMsgs = [...user.receivedMsgs];
        filteredMsgs = filters.filterMessages(filteredMsgs, search);
        return res.status(200).render('admin/received-messages', {
            msgs: filteredMsgs,
            pageTitle: 'Messages',
            path: '/admin/received-messages',
            filter: true
        });
    }).catch(() => next(new Error("ERROR! Please try again.")));
};

exports.getJSONSentMsgs = (req, res) => {
    const msgs = req.user.sentMsgs.map(msg => msg.message.title);
    return res.status(200).json({
        message: 'Info fetched successfully',
        messages: msgs
    });
};

exports.getSentMessages = (req, res, next) => {
    const ITEMS_PER_PG = 4;
    const page = req?.query?.page ? Number.parseInt(req.query.page) : 1;
    let count = req.user.sentMsgs.length;
    if ((page > Math.ceil(count / ITEMS_PER_PG)) && (page > 1)) {
        return next(new Error("Page does not exist! Please go to the first page."));
    }
    if (page < 1) {
        return next(new Error("Page does not exist! Please go to the first page."));
    }
    User.findById(req.user._id).populate('sentMsgs.toId', '_id username isOnline').then(user => {
        res.render('admin/sent-messages', {
            msgs: user.sentMsgs.slice((page - 1) * ITEMS_PER_PG, page * ITEMS_PER_PG),
            pageTitle: 'Messages',
            path: '/admin/sent-messages',
            currentPage: page,
            hasNextPage: (page < Math.ceil(count / ITEMS_PER_PG)) ? true : false,
            hasPreviousPage: (page > 1) ? true : false,
            nextPage: page + 1,
            previousPage: page - 1,
            filter: false
        });
    }).catch(() => next(new Error("ERROR! Please try again.")));
};

exports.getFilteredSentMsgs = (req, res, next) => {
    let search = req.body.filter;
    User.findById(req.user._id).populate('sentMsgs.toId', '_id username isOnline').then(user => {
        let filteredMsgs = [...user.sentMsgs];
        filteredMsgs = filters.filterMessages(filteredMsgs, search);
        return res.status(200).render('admin/sent-messages', {
            msgs: filteredMsgs,
            pageTitle: 'Messages',
            path: '/admin/sent-messages',
            filter: true
        });
    }).catch(() => next(new Error("ERROR! Please try again.")));
};

exports.deleteReceivedMessage = (req, res, next) => {
    const { msgId } = req.body;
    req.user.deleteReceivedMessage(msgId).then(() => {
        res.redirect('/admin/received-messages');
    }).catch(err => {
        if (err.message == 'No such message!') {
            return next(new Error(err.message));
        }
        next(new Error("An error occurred! Please try again."))
    });
};

exports.deleteSentMessage = (req, res, next) => {
    const { msgId } = req.body;
    req.user.deleteSentMessage(msgId).then(() => {
        res.redirect('/admin/sent-messages');
    }).catch(err => {
        if (err.message == 'No such message!') {
            return next(new Error(err.message));
        }
        next(new Error("An error occurred! Please try again."));
    });
};

exports.getSentMessage = (req, res, next) => {
    const msgId = req.params.msgId;
    const findIndex = req.user.sentMsgs.findIndex(msg => msg._id.toString() === msgId);
    if (findIndex === -1) {
        return next(new Error("No such message!"));
    }
    User.findOne({ _id: req.user._id }).populate('sentMsgs.toId', '_id username email isOnline').then(user => {
        res.render('admin/sent-message', {
            msg: user.sentMsgs[findIndex],
            pageTitle: 'Message',
            path: '/admin/sent-messages/detail'
        });
    }).catch(() => next(new Error("An error occurred! Try again.")));;
};

exports.getReceivedMessage = (req, res, next) => {
    const msgId = req.params.msgId;
    const findIndex = req.user.receivedMsgs.findIndex(msg => msg._id.toString() === msgId);
    if (findIndex === -1) {
        return next(new Error("No such message!"));
    }
    User.findOne({ _id: req.user._id }).populate('receivedMsgs.fromId', '_id username email isOnline').then(user => {
        res.render('admin/received-message', {
            msg: user.receivedMsgs[findIndex],
            pageTitle: 'Message',
            path: '/admin/received-messages/detail'
        });
    }).catch(() => next(new Error("An error occurred! Try again.")));
};

exports.postClearReceivedMsgs = (req, res, next) => {
    req.user.receivedMsgs = [];
    req.user.save().then(() => {
        res.redirect('/admin/received-messages');
    }).catch(() => next(new Error("Server-error! please try again.")));
};

exports.postClearSentMsgs = (req, res, next) => {
    req.user.sentMsgs = [];
    req.user.save().then(() => {
        res.redirect('/admin/sent-messages');
    }).catch(() => next(new Error("Server-error! please try again.")));
};

exports.getAdminSettings = (req, res) => {
    res.render('admin/settings', {
        pageTitle: 'Settings',
        path: '/admin/settings',
        errorMsg: null,
        username: req.user.username,
        email: req.user.email,
        secretQuestion: req.user.secretQuestion,
        validationErrors: []
    });
};

exports.postAdminSettings = (req, res, next) => {
    const { username, email, password, secretQuestion, answer } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const err = errors.array()[0];
        if ((err.param === 'password' && password === "") || (err.param === 'answer' && answer === "")) {
            return bcrypt.hash(password, 12).then(hashedPassword => {
                req.user.username = username;
                req.user.email = email;
                req.user.password = password.length ? hashedPassword : req.user.password;
                if (!answer.length) {
                    return "";
                }
                return bcrypt.hash(answer, 12);
            }).then(hashedAns => {
                req.user.secretQuestion = secretQuestion;
                req.user.answer = answer.length ? hashedAns : req.user.answer;
                return req.user.save();
            }).then(() => {
                return res.redirect('/admin/settings');
            }).catch(() => next(new Error("An error occurred!")));
        } else {
            return res.status(422).render('admin/settings', {
                pageTitle: 'Settings',
                path: '/admin/settings',
                errorMsg: err.msg,
                username: username,
                email: email,
                secretQuestion: secretQuestion,
                validationErrors: errors.array()
            });
        }
    }

    bcrypt.hash(password, 12).then(hashedPassword => {
        req.user.username = username;
        req.user.email = email;
        req.user.password = hashedPassword;
        return bcrypt.hash(answer, 12);
    }).then(hashedAns => {
        req.user.secretQuestion = secretQuestion;
        req.user.answer = hashedAns;
        return req.user.save();
    }).then(() => {
        return res.redirect('/admin/settings');
    }).catch(() => next(new Error("An error occurred!")));
};







