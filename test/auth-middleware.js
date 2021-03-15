const expect = require('chai').expect
const jwt = require('jsonwebtoken')
const sinon = require('sinon') 

const authMiddleware = require('../middleware/is-auth')

//Here we test our is-auth middleware function
//This is also calles unit-test as here we are testing a unit(a function) of the application

// it('should throw an error if no authorization header is present', function () {
//     //now we define our own customised request object
//     const req = {
//         get: function (headerName) {
//             return null;  //does not return a value(here we are stimulating that there is no authorization header)
//         }
//     }
//     //we define only the things required for testing the auth function
//     expect(authMiddleware.bind(this, req, {}, () => { })).to.throw('Not authenticated'); //we dont call the fuction ourselves here but we prepare the reference of function which will be called by mocha when testing
// }) //This test wont succeed if we are not throwing an error or we throw an error with some other message


// it('should throw an error if the authorization header is only one string', function () { //here we check that an error is thrown if the token does not has any space character
//     const req = {
//         get: function (headerName) {
//             return 'xyz';
//         }
//     }
//     expect(authMiddleware.bind(this, req, {}, () => { })).to.throw();
// })

//now we group the above tests under a single heading message so that reading test results becomes easier and we get a better insight which result refers to which unit

describe('Auth middleware', function () {
    it('should throw an error if no authorization header is present', function () {
        //now we define our own customised request object
        const req = {
            get: function (headerName) {
                return null;  //does not return a value(here we are stimulating that there is no authorization header)
            }
        }
        //we define only the things required for testing the auth function
        expect(authMiddleware.bind(this, req, {}, () => { })).to.throw('Not authenticated'); //we dont call the fuction ourselves here but we prepare the reference of function which will be called by mocha when testing
    }) //This test wont succeed if we are not throwing an error or we throw an error with some other message

    it('should throw an error if the authorization header is only one string', function () { //here we check that an error is thrown if the token does not has any space character
        const req = {
            get: function (headerName) {
                return 'xyz';
            }
        }
        expect(authMiddleware.bind(this, req, {}, () => { })).to.throw();
    })

    it('should yield a userId after decoding the token', function () {
        const req = {
            get: function (headerName) {
                return 'Bearer jhgdfgiuwhhfkjgsdsdh';
            }
        }
        // jwt.verify = () => { //here we overwrite the jwt verify function that is present globally in the app
        //     return { userId: "abc" };
        // }
        sinon.stub(jwt, 'verify');
        jwt.verify.returns({
            userId: 'abc'
        })
        authMiddleware(req, {}, () => { });
        expect(req).to.have.property('userId');
        expect(req).to.have.property('userId', 'abc');
        expect(jwt.verify.called).to.be.true;
        jwt.verify.restore() //restores original function
    })

    it('should trow an error if the token cannot be verified', function () {
        const req = {
            get: function (headerName) {
                return 'Bearer xyz';
            }
        }
        expect(authMiddleware.bind(this, req, {}, () => { })).to.throw();
        
    })
})