const expect = require('chai').expect;
const sinon = require('sinon');
const mongoose = require('mongoose')
const io = require('../socket');



const Post = require('../models/post')
const User = require('../models/user');

const feedController = require('../controllers/feed')

describe('Feed Controller', function () {
    before(function (done) { //executes once before starting execution of 'it' test cases
        mongoose.connect('mongodb+srv://harsh:harsharora@1999@cluster0.kjmvg.mongodb.net/test-messages?retryWrites=true&w=majority', {  //note that here we used a test database and not the production database
            useNewUrlParser: true
        }).then(result => {
            const user = new User({
                email: 'test@test.com',
                password: 'tester',
                name: 'Test',
                posts: [],
                _id: '5c0f66b979af55031b34728a'
            })
            return user.save();
        }).then(() => {
            done();
        })
    })
    
    it('should add a created post to the posts of the creator', function (done) {
        const req = {
            body: {
                title: 'Test Post',
                content: 'A Test Post'
            },
            file: {
                path: 'abc'
            },
            userId: '5c0f66b979af55031b34728a'
        }
        const res = {
            status: function () {
                return this;
            },
            json: function () {
                
            }
        }
        sinon.stub(io, 'getIO');
        io.getIO.returns({ emit: () => {} });
        feedController.postPost(req, res, () => { }).then(savedUser => {
            expect(savedUser).to.have.property('posts');
            expect(savedUser.posts).to.have.length(1);
            io.getIO.restore();
            done(); //now it signals mocha that the test is complete after this asynchonous execution
        })
        
    })

   

    after(function (done) { //this executes after the finish execution of the 'it' test cases
        User.deleteMany({})
            .then(() => {
                return mongoose.disconnect()
            }).then(() => {
                done();
            }); //here we delete all users created before ending the test
    })

    beforeEach(function () {  //this runs before every 'it' call(before each test case)
        
    })

    afterEach(function () {  //this runs after every 'it' call(after each test case)
        
    })

})