//this file will extract token from incoming request and check if it is valid or not.
const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization'); //we can get a header value using get method (here we get the value of JWT token sent to the server in request header)
    if (!authHeader) {
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error;
    }
    const token = authHeader.split(' ')[1]; 
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, 'somesecret') //decodes and verifies
        //decodedToken = { userId: 'abc' };
    } catch(err) {
        err.statusCode = 500;
        throw err;
    }
    if (!decodedToken) {
        const error = new Error('Not authenticated.')
        error.statusCode = 401;
        throw error;
    }
    req.userId = decodedToken.userId;
    next();

}