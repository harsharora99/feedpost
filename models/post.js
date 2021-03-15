const mongoose = require('mongoose');


const Schema = mongoose.Schema;

const postSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { 
    timestamps: true  //now mongoose will add timestamp fields (such as createdAt, updatedAt) whenever a post is created
})

module.exports = mongoose.model('Post', postSchema) //model based on the Schema above