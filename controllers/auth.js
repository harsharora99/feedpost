const { validationResult } = require('express-validator/check')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const User = require('../models/user');

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    // bcrypt.hash(password, 12)
    //     .then(hashedPw => {
    //         const user = new User({
    //             email: email,
    //             password: hashedPw,
    //             name: name
    //         })
    //         return user.save()
    //     })
    //     .then(result => {
    //         res.status(201).json({
    //             message: 'User created!',
    //             userId: result._id
    //         })
    //     })
    //     .catch(err => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     })

    try {
        
        const hashedPw = await bcrypt.hash(password, 12)

            const user = new User({
                email: email,
                password: hashedPw,
                name: name
            })
            await user.save()
            
                res.status(201).json({
                    message: 'User created!',
                    userId: user._id
                })
    } catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

}

exports.login = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    try {
        const user = await User.findOne({ email: email })
        
            if (!user) {
                const error = new Error('A user with this email could not be found.')
                error.statusCode = 401; //not authenticated
                throw error;
            }
            loadedUser = user;
            const isEqual =  await bcrypt.compare(password, user.password);
            
                if (!isEqual) {
                    const error = new Error('Wrong password!');
                    error.statusCode = 401;
                    throw error;
                }
                const token = jwt.sign({
                    email: loadedUser.email,
                    userId: loadedUser._id.toString()
                }, 'somesecret', {
                    expiresIn: '1h' //expires in 1 hour (it is must to expire the tokens in some time period as the token is stored on the client side and any 3rd person can copy that token from the user and use it in his/her PC forever!) (user will be automatically logged out after 1 hour)
                }) //second argument 'somesecret' string ia a private secret key which should only be known to the server (it can be any long random string but should be known to the backend server)
                res.status(200).json({
                    token: token,
                    userId: loadedUser._id.toString()
                })
                 return;
    } catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
        return err; //this line will now implicitly return a promise
    }
}

exports.getUserStatus = async (req, res, next) => {
    //console.log('heyheyyy');
    // User.findById(req.userId)
    //     .then(user => {
    //         if (!user) {
    //             const error = new Error('User not found.')
    //             error.statusCode = 404;
    //             throw error;
    //         }
    //         res.status(200).json({
    //             status: user.status
    //         })
    //     })
    //     .catch(err => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     })
    try {
        const user = await User.findById(req.userId)

            if (!user) {
                const error = new Error('User not found.')
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                status: user.status
            })
    } catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.updateUserStatus = async (req, res, next) => {
    //console.log('hehhhehehehe')
    const newStatus = req.body.status;
    // User.findById(req.userId)
    //     .then(user => {
    //         if (!user) {
    //             const error = new Error('User not found.');
    //             error.statusCode = 404;
    //             throw error;
    //         }
    //         user.status = newStatus;
    //         return user.save();
    //     })
    //     .then(result => {
    //         res.status(200).json({
    //             message: 'User updated!'
    //         })
    //     })
    //     .catch(err => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     })
    try {
        
        const user = await User.findById(req.userId)
    
            if (!user) {
                const error = new Error('User not found.');
                error.statusCode = 404;
                throw error;
            }
            user.status = newStatus;
            await user.save();
            
                res.status(200).json({
                    message: 'User updated!'
                })
    } catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}