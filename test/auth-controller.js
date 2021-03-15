const expect = require('chai').expect;
const sinon = require('sinon');
const mongoose = require('mongoose')

const User = require('../models/user');
const authController = require('../controllers/auth')

describe('Auth Controller', function () {
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
    it('should throw an error with code 500 if accessing the database fails', function (done) {
        sinon.stub(User, 'findOne');
        User.findOne.throws(); //here we force findOne to throw error
        const req = {
            body: {
                email: "test@test.com",
                password: "tester"
            }
        }
        authController.login(req, {}, () => { }).then(result => {
            expect(result).to.be.an('error');
            expect(result).to.have.property('statusCode', 500);
            done(); //now it signals mocha that the test is complete after this asynchonous execution
        })

        User.findOne.restore();

        
    })

    it('should send a response with a valid user status for an existing user', function (done) {

            const req = { userId: '5c0f66b979af55031b34728a' };
            const res = {
                statusCode: 500,
                userStatus: null,
                status: function (code) {
                    this.statusCode = code;
                    return this;
                },
                json: function (data) {
                    this.userStatus = data.status
                }
            }
            authController.getUserStatus(req, res, ()=>{})
                .then(() => {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.userStatus).to.be.equal('I am new!');
                    done();
                    
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