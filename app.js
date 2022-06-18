const path = require('path');

const express = require('express');
const mongoose = require('mongoose');
const csrf = require('csurf');
const session = require('express-session');
const multer = require('multer');
const MongoDBStore = require('connect-mongodb-session')(session);
// 40000000 bytes of max file size
const helmet = require('helmet');

//Models
const User = require('./models/user');

//Controllers
const errorController = require('./controllers/error');

//Routes
const authRoutes = require('./routes/auth');
const commonRoutes = require('./routes/common');
const adminRoutes = require('./routes/admin');
const app = express();

// var blackList = {
// <example addresses>
//     '77.88.99.1': true,
//     '88.77.99.1': true
// };

// app.use((req, res, next) => {
//     const ip = req.ip || req.socket.remoteAddress;
//     if (ip in blackList) {
//         return res.end(); // exit if it is a black listed ip
//     }
//     next();
// });

const MONGODB_URI = ``;

const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions',
    expires: 6 * 60 * 60 * 1000
});

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(helmet());

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'files');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    const FILE_TYPES = new Set(['image/png', 'image/jpg', 'image/jpeg', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-m4a', 'audio/x-m4p', 'audio/x-m4b', 'video/mp4', 'video/webm', 'video/ogg', 'video/x-m4a', 'video/x-m4p', 'video/x-m4b']);
    if (FILE_TYPES.has(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('File type not allowed. Try again with a different file'));
    }
};
// Can do: app.use(multer({storage:<>,fileFilter:<>,limits:{fields,files,fileSize(inbytes)}}).single('file/input-field name'));
const upload = multer({ storage: fileStorage, fileFilter: fileFilter, limits: { fields: 4, files: 1, fileSize: 15000000 } }).single('file');

app.use(express.urlencoded({ extended: true, limit: '100kb' }));
// Add - routes for multer middleware
app.post('/admin/add-post', (req, res, next) => {
    upload(req, res, err => {
        if (err) {
            res.writeHead(422, { Connection: 'close' });
            // res.end('');
            return res.end(err.message);
        }
        return next();
    })
});
// Edit - route
app.post('/admin/edit-post', (req, res, next) => {
    upload(req, res, err => {
        if (err) {
            res.writeHead(422, { Connection: 'close' });
            return res.end(err.message);
        }
        return next();
    })
});
// app.use(multer({ storage: fileStorage, fileFilter: fileFilter, limits: { files: 1, fields: 4, fileSize: 15000000 } }).single('file'));
app.use(express.static(path.join(__dirname, 'public'))); // serving static files
app.use('/files', express.static(path.join(__dirname, 'files')));
app.use(session({ store: store, resave: false, cookie: { maxAge: 6 * 60 * 60 * 1000, sameSite: 'strict', httpOnly: true }, saveUninitialized: false, secret: '' }));
app.use(csrf());

app.use((req, res, next) => {
    // For Rendering
    res.locals.csrfToken = req.csrfToken();
    res.locals.isAuthenticated = req.session.isLoggedIn || false;

    // Session parsing, verifying & user identifying
    if (!req.session.userId) {
        return next();
    }
    let currentUser;
    User.findById(req.session.userId).then(user => {
        if (!user) {
            return next();
        }
        currentUser = user;
        if (user.isOnline) {
            return currentUser;
        }
        user.isOnline = req.session.isLoggedIn || false;
        return user.save();
    }).then(user => {
        if (user) {
            req.user = user;
        }
        next();
    }).catch(() => {
        next(new Error("Error! Something went wrong."));
    });
});

app.use('/admin', adminRoutes);
app.use(authRoutes);
app.use(commonRoutes);
app.use(errorController);

app.use((err, req, res, next) => {
    res.render('error', {
        pageTitle: 'Error',
        path: '/error',
        isAuthenticated: req.user ? true : false,
        errorMsg: err.message
    });
});

mongoose.connect(MONGODB_URI, { useUnifiedTopology: true, useNewUrlParser: true }).then(() => {
    app.listen(process.env.PORT || 3000);
    // const io = require("./socket").init(server);
    // io.on("connection", socket => {
    //     console.log("Client connected", socket.id);
    // });
}).catch(err => {
    console.log(err);
});
