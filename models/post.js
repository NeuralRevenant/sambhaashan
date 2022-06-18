const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    fileType: String,
    filePath: String,
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

// postSchema.plugin is for adding custom autoIncrement functions, etc on the fields of the model/schema

module.exports = mongoose.model('Post', postSchema);