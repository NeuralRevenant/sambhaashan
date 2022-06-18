const fs = require('fs');
const path = require('path');

const Post = require('../models/post');

exports.deleteForAll = (req, res, next) => {
    const allIds = [...req.user.friends.map((friend) => friend.userId), req.user._id];
    Post.find({ userId: allIds }).then(posts => {
        if (!posts) {
            return next();
        }
        const deletedPosts = [];
        for (let post of posts) {
            if (!post.filePath) {
                continue;
            }
            if (!fs.existsSync(path.join(__dirname, '..', post.filePath))) {
                deletedPosts.push(post);
            }
        }
        // Can use .deleteMany({_id:{$in:deletePosts.map(modification)}})
        return Post.deleteMany({ _id: deletedPosts.map(post => post._id) });
    }).then(posts => {
        return next();
    }).catch(err => next(new Error("Server-Error! Please try again.")));
};

exports.deleteForUser = (req, res, next) => {
    // const allIds = [...req.user.friends.map((friend) => friend.userId), req.user._id];
    Post.find({ userId: req.user._id }).then(posts => {
        if (!posts) {
            return next();
        }
        const deletedPosts = [];
        for (let post of posts) {
            if (!post.filePath) {
                continue;
            }
            if (!fs.existsSync(path.join(__dirname, '..', post.filePath))) {
                deletedPosts.push(post);
            }
        }
        return Post.deleteMany({ _id: deletedPosts.map(post => post._id) });
    }).then(posts => {
        return next();
    }).catch(err => next(new Error("Server-Error! Please try again.")));
};