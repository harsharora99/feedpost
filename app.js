require('dotenv').config()

const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const fileUploader = require('./configs/cloudinary.config');
require('dotenv').config()

const feedRoutes = require('./routes/feed')
const authRoutes = require('./routes/auth');

const app = express();
// const fileStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'images');  //store in 'images' folder
//     },
//     filename: (req, file, cb) => {
//         cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
//     }
// })

// const fileFilter = (req, file, cb) => {
//     if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
//         cb(null, true);
//     } else {
//         cb(null, false);
//     }
// }

//app.use(bodyParser.urlencoded()); //x-www-form-urlencoded <form>

app.use(bodyParser.json()) //Parses incoming JSON data (application/json)

//app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')); //will look for 'image' named field in the request and will parse the file stored in that field 

app.use(fileUploader.single('image'))

//app.use('/images', express.static(path.join(__dirname, 'images')))

//below middleware is executed for all the requests and this middleware allows different frontend domains/servers(which are rendering the UI and sending requests to our server) to send requests and get responses.
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')  //This does not sends back the response (like render and json send back the response) but this just configures the response by adding data to the res header
    //'*' means we allow all the domains. Here, instead of '*' we could have also used some domain like 'codepen.io'
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    //Now we allow the specified domains to send requests with given methods and also can set the header fields that are specified
    //console.log('aa');
    next();
})

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    app.use(express.static(path.join(__dirname, 'client/build')));
    //console.log('a');
};



app.use('/feed', feedRoutes);

app.use('/auth', authRoutes);


app.use('*', function (req, res) {
    //console.log('haa');
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data
    res.status(status).json({
        message: message,
        data: data
    })
})

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true}).then(result => {
    const server = app.listen(process.env.PORT || 8080);
    const io = require('./socket').init(server); //require returns a function which when called returns an object
    io.on('connection', socket => { //socket is the connection between server and client (this function will be excuted whenever a new client connects)
        console.log('Client connected');

    }) //defining an event-listener

}).catch(err => console.log(err))
//now connects to messages database on our mongodb server