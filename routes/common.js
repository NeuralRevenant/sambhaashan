const express = require('express');

const commonController = require('../controllers/common');
const isAuth = require('../middleware/is_auth');
const deleteEmptied = require('../middleware/delete_nonexistent');

const router = express.Router();

router.post('/filter-all-posts', isAuth, deleteEmptied.deleteForAll, commonController.getFilterAllPosts);

router.post('/filter-posts', isAuth, deleteEmptied.deleteForUser, commonController.getFilterPosts);

router.get('/posts/:postId', isAuth, deleteEmptied.deleteForUser, commonController.getPost);

router.get('/all-posts-autocomplete', isAuth, deleteEmptied.deleteForAll, commonController.getJSONAllPosts);

router.get('/all-posts', isAuth, deleteEmptied.deleteForAll, commonController.getAllPosts);

router.get('/posts-autocomplete', isAuth, deleteEmptied.deleteForUser, commonController.getJSONUserPosts);

router.get('/', isAuth, deleteEmptied.deleteForUser, commonController.getPosts);

module.exports = router;
