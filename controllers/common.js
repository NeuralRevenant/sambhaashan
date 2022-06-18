const Post = require('../models/post');
const filters = require('../util/filters');

const ITEMS_PER_PG = 2;

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    const users = new Set(req.user.friends.map(user => user.userId.toString()));
    users.add(req.user._id.toString());
    Post.findById(postId).populate('userId').then(post => {
        if (!post) {
            return next(new Error("No such post!"));
        }
        if (!users.has(post.userId._id.toString())) {
            return next(new Error("Not Authorized!"));
        }
        res.render('common/post-detail', {
            post: post,
            pageTitle: post.title,
            path: '/posts',
            filetype: post.fileType,
            isUserPost: post.userId._id.toString() === req.user._id.toString()
        });
    }).catch(err => {
        return next(new Error("Error! No such post"));
    });
};

// json-res-user-posts
exports.getJSONUserPosts = (req, res, next) => {
    Post.find({ userId: req.user._id }).then(posts => {
        return res.json({
            message: 'Info fetched successfully',
            posts: posts.map(post => post.title)
        });
    }).catch(err => next(new Error("An error occurred!")));
};

exports.getPosts = (req, res, next) => {
    const page = (req?.query?.page ? Number.parseInt(req.query.page) : 1);
    let items;
    Post.find({ userId: req.user._id }).countDocuments().then(count => {
        items = count;
        if ((page > Math.ceil(count / ITEMS_PER_PG)) && page > 1) {
            throw new Error("Page does not exist! Please go to the first page.");
        }
        if (page < 1) {
            throw new Error("Page does not exist! Please go to the first page.");
        }
        return Post.find({ userId: req.user._id }).skip((page - 1) * ITEMS_PER_PG).limit(ITEMS_PER_PG);
    }).then(posts => {
        res.render('admin/posts', {
            posts: posts,
            pageTitle: 'Posts',
            path: '/',
            currentPage: page,
            hasNextPage: (page < Math.ceil(items / ITEMS_PER_PG)),
            hasPreviousPage: (page > 1),
            nextPage: page + 1,
            previousPage: page - 1,
            filter: false
        });
    }).catch(err => {
        if (err.message == "Page does not exist! Please go to the first page.") {
            return next(new Error(err.message));
        }
        next(new Error("Error! Please reload and try again."));
    });
};

// json-res-all-posts
exports.getJSONAllPosts = (req, res, next) => {
    const userIds = [...req.user.friends.map(friend => friend.userId), req.user._id];
    Post.find({ userId: { $in: userIds } }).then(posts => {
        return res.json({
            message: 'Info fetched successfully',
            posts: posts.map(post => post.title)
        });
    }).catch(err => next(new Error("An error occurred!")));
};

exports.getAllPosts = (req, res, next) => {
    const page = (req?.query?.page ? Number.parseInt(req.query.page) : 1);
    let items;
    const allIds = [...req.user.friends.map(friend => friend.userId), req.user._id];
    Post.find({ userId: allIds }).countDocuments().then(count => {
        items = count;
        if ((page > Math.ceil(count / ITEMS_PER_PG)) && page > 1) {
            throw new Error("Page does not exist! Please go to the first page.");
        }
        if (page < 1) {
            throw new Error("Page does not exist! Please go to the first page.");
        }
        return Post.find({ userId: allIds }).skip((page - 1) * ITEMS_PER_PG).limit(ITEMS_PER_PG);
    }).then(posts => {
        return res.render('admin/all-posts', {
            posts: posts,
            pageTitle: 'Posts',
            path: '/all-posts',
            currentPage: page,
            hasNextPage: (page < Math.ceil(items / ITEMS_PER_PG)),
            hasPreviousPage: (page > 1),
            nextPage: page + 1,
            previousPage: page - 1,
            filter: false
        });
    }).catch(err => {
        if (err.message == "Page does not exist! Please go to the first page.") {
            return next(new Error(err.message));
        }
        next(new Error("Error! Please reload and try again."));
    });
};

exports.getFilterPosts = (req, res, next) => {
    let page = 1;
    let search = req.body.filter;
    Post.find({ userId: req.user._id }).then(posts => {
        if (!posts) {
            return res.redirect('/');
        }
        let filteredProds = [...posts];
        filteredProds = filters.filter(filteredProds, search);
        return res.status(200).render('admin/posts', {
            path: '/',
            pageTitle: 'Your Posts',
            posts: filteredProds,
            currentPage: page,
            hasNextPage: page < Math.ceil(filteredProds.length / ITEMS_PER_PG),
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            filter: true
        });
    }).catch(err => {
        return next(new Error("An error occurred! try again."));
    });
};

exports.getFilterAllPosts = (req, res, next) => {
    const page = 1;
    const allIds = [...req.user.friends.map(friend => friend.userId), req.user._id];
    let search = req.body.filter;
    Post.find({ userId: allIds }).then(posts => {
        if (!posts) {
            return res.redirect('/all-posts');
        }
        let filteredProds = [...posts];
        filteredProds = filters.filter(filteredProds, search);
        return res.status(200).render('admin/all-posts', {
            path: '/all-posts',
            pageTitle: 'All Posts',
            posts: filteredProds,
            currentPage: page,
            hasNextPage: page < Math.ceil(filteredProds.length / ITEMS_PER_PG),
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            filter: true
        });
    }).catch(err => {
        return next(new Error("An error occurred! try again."));
    });
};