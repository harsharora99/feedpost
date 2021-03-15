const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator/check');

const io = require('../socket')
const Post = require('../models/post');
const User = require('../models/user');
const { isObject } = require('util');

exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    // let totalItems;
    // Post.find().countDocuments()
    //     .then(count => {
    //         totalItems = count;
    //         return Post.find().skip((currentPage - 1) * perPage).limit(perPage).populate('creator');
    //     })
    //     .then(posts => {
    //         res.status(200).json({
    //             message: 'Fetched posts successfully.',
    //             posts: posts,
    //             totalItems: totalItems
    //         })
    //     })
    //     .catch(err => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     })
    //above then-catch statements changed to async-awiat style
    //behind the scenes the below statements will be changed back to then-catch style
    try {
        const totalItems = await Post.find().countDocuments()
        
        const posts = await Post.find().skip((currentPage - 1) * perPage).limit(perPage).sort({ createdAt: -1 }).populate('creator')
            
                res.status(200).json({
                message: 'Fetched posts successfully.',
                    posts: posts,
                    totalItems: totalItems
                })

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
    // res.status(200).json({
    //     posts: [
    //         {
    //             _id:'1',
    //             title: 'First Post',
    //             content: 'This is the first post!',
    //             imageUrl: 'images/duck.jpg',
    //             creator: {
    //                 name: 'Harsh'
    //             },
    //             createdAt: new Date()
    //         }
    //     ]
    // });
    //return a response with json data
    //.json() function automatically sets the content-type field in response header to 'application/json' 
}

exports.postPost = async (req, res, next) => { //creates a post
    const errors = validationResult(req);
    console.log('heyma')
    if (!errors.isEmpty()) {
        const error = new Error('Validation Failed, entered data is incorrect.');
        error.statusCode = 422;
        throw error;
        // return res.status(422).json({  //Validation failed
        //     message: 'Validation Failed, entered data is incorrect.',
        //     errors: errors.array()
        // })
    }
    console.log('hey');
    if (!req.file) { //if file is undefined
        const error = new Error('No image provided.');
        error.statusCode = 422; //validation error
        throw error;
    }
    const imageUrl = req.file.path;
    const title = req.body.title;
    const content = req.body.content;
    let creator;
    //Create post in db
    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        // creator: {
        //     name:'Harsh'
        // }
        creator: req.userId //mongoose will automatically convert this string to ObjectId
    })
    console.log(post.imageUrl);
    // post.save()
    //     .then(result => {
    //         return User.findById(req.userId);
    //         console.log(result.imageUrl);  
    //     })
    //     .then(user => {
    //         creator = user;
    //         user.posts.push(post);
    //         return user.save();   
    //     })
    //     .then(result => {
    //         res.status(201).json({
    //             message: 'Post created successfully',
    //             post: post,
    //             creator: {
    //                 _id: creator._id,
    //                 name: creator.name
    //             }
    //         })
    //     })
    //     .catch(err => {
    //         //console.log(err)
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     })
    try {
        
        await post.save();
            
            const user = await User.findById(req.userId);
            user.posts.push(post);
            const savedUser = await user.save();
        
                io.getIO().emit('posts', {
                    action: 'create',
                    post: {
                        ...post._doc, creator: {
                            _id: req.userId,
                            name: user.name
                        }
                    }
                }) //sending object to all the connected clients which have made a socket connection with the backend server
                //here names posts, action and post are user defined(we can use any names)
                //posts is event name and this same name will have to be used on frontend server to listen to this event
                //object passed is data object
                res.status(201).json({
                    message: 'Post created successfully',
                    post: post,
                    creator: {
                        _id: user._id,
                        name: user.name
                    }
                })
                return savedUser; 
    } catch(err) {
        //console.log(err)
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
    
}

exports.getPost = async (req, res, next) => {
    const postId = req.params.postId;
    
    try {
        const post = await Post.findById(postId)
            .populate('creator')
        
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                throw error; //this error will be catched by the below catch block as this is in a asynchronous then block and then the catch block will call next(err) which then triggers the error handling middleware
            }
            res.status(200).json({
                message: 'Post fetched',
                post: post
            })
    } catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }   
}

exports.updatePost = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation Failed, entered data is incorrect.');
        error.statusCode = 422;
        throw error;
        // return res.status(422).json({  //Validation failed
        //     message: 'Validation Failed, entered data is incorrect.',
        //     errors: errors.array()
        // })
    }
    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if (req.file) {
        imageUrl = req.file.path; //if an image file was selected
    }
    if (!imageUrl) {
        const error = new Error('No file picked.');
        error.statusCode = 422;
        throw error;
    }
    // Post.findById(postId)
    //     .then(post => {
    //         if (!post) {
    //             const error = new Error('Could not find post.');
    //             error.statusCode = 404;
    //             throw error;
    //         }
    //         if (post.creator.toString() !== req.userId) {
    //             const error = new Error('Not authorized!');
    //             error.statusCode = 403;
    //             throw error;
    //         }
    //         if (imageUrl !== post.imageUrl) {
    //             clearImage(post.imageUrl);
    //         }
    //         post.title = title;
    //         post.imageUrl = imageUrl;
    //         post.content = content;
    //         console.log(post.imageUrl)
    //         return post.save();
    //     })
    //     .then(result => {
    //         res.status(200).json({
    //             message: 'Post updated!',
    //             post: result
    //         })
    //     })
    //     .catch(err => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     })

    try {
        
        const post = await Post.findById(postId).populate('creator')
            
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                throw error;
            }

            if (post.creator._id.toString() !== req.userId) {
                const error = new Error('Not authorized!');
                error.statusCode = 403;
                throw error;
            }

            if (imageUrl !== post.imageUrl) {
                clearImage(post.imageUrl);
            }

            post.title = title;
            post.imageUrl = imageUrl;
            post.content = content;
            console.log(post.imageUrl)
            const result = await post.save();    
                io.getIO().emit('posts', {
                    action: 'update',
                    post: result
                })
                res.status(200).json({
                    message: 'Post updated!',
                    post: result
                })
    } catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }  

}

exports.deletePost = async (req, res, next) => {
    const postId = req.params.postId;
    // Post.findById(postId)
    //     .then(post => {
    //         if (!post) {
    //             const error = new Error('Could not find post.');
    //             error.statusCode = 404;
    //             throw error;
    //         }
    //         if (post.creator.toString() !== req.userId) {
    //             const error = new Error('Not authorized!');
    //             error.statusCode = 403;
    //             throw error;
    //         }         
    //         clearImage(post.imageUrl);
    //         return Post.findByIdAndRemove(postId);
    //     })
    //     .then(result => {
    //         console.log(result);
    //         return User.findById(req.userId);
    //     })
    //     .then(user => {
    //         user.posts.pull(postId) //pull method is provided by mongoose in which we can provide the id to remove the reference(here we remove the objectId of the post from its user)
    //         return user.save();
    //     })
    //     .then(result => {
    //         res.status(200).json({message: 'Deleted post.'})
    //     })
    //     .catch(err => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     })
    try {
        
        const post = await Post.findById(postId)
            
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                throw error;
            }
            if (post.creator.toString() !== req.userId) {
                const error = new Error('Not authorized!');
                error.statusCode = 403;
                throw error;
            }
            
            clearImage(post.imageUrl);
            await Post.findByIdAndRemove(postId);
        
                const user = await User.findById(req.userId);
        
           
                    user.posts.pull(postId) //pull method is provided by mongoose in which we can provide the id to remove the reference(here we remove the objectId of the post from its user)
                    await user.save();
                        
                        io.getIO().emit('posts', {
                            action: 'delete',
                            post: postId
                        })
                        res.status(200).json({message: 'Deleted post.'})
    } catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

const clearImage = filePath => {
    //filePath = path.join(filePath); //we can also use path.join(__dirname, '..', filePath)
    fs.unlink(filePath, err => console.log(err)); //this asynchronous code cannot be changed to async await
}