require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');
const { S3Client } = require('@aws-sdk/client-s3');
const User = require('./models/User');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();

// Configure S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Make S3 client available to routes
app.locals.s3Client = s3Client;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 5,
    ssl: true,
    tlsAllowInvalidCertificates: false
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Passport configuration
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return done(null, false, { message: 'Incorrect email.' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60 // 1 day
    })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Make flash messages available to all views
app.use((req, res, next) => {
    res.locals.messages = {
        success: req.flash('success'),
        error: req.flash('error')
    };
    res.locals.user = req.user;
    next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Serve React app for all routes
app.get('*', (req, res) => {
    res.render('dashboard');
});

// Serve login and register pages
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

// Protected route example
app.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    res.render('dashboard', { user: req.user });
});

// Root route redirect to login if not authenticated
app.get('/', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    res.redirect('/dashboard');
});

// Function to find an available port
const findAvailablePort = async (startPort) => {
    const net = require('net');
    
    const isPortAvailable = (port) => {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.listen(port, () => {
                server.once('close', () => resolve(true));
                server.close();
            });
            server.on('error', () => resolve(false));
        });
    };

    let port = startPort;
    while (!(await isPortAvailable(port))) {
        port++;
    }
    return port;
};

// Start server with port finding
const startServer = async () => {
    try {
        const port = await findAvailablePort(process.env.PORT || 3004);
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
            console.log(`Visit http://localhost:${port} to access the application`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer(); 