const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Please login to access this page.');
    res.redirect('/login');
};

// Dashboard route
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const applications = await Application.find({ userId: req.user._id })
            .sort({ createdAt: -1 });
        res.render('index', { 
            applications,
            page: 'dashboard'
        });
    } catch (error) {
        req.flash('error', 'Error loading applications.');
        res.redirect('/');
    }
});

// Analytics route
router.get('/analytics', isAuthenticated, async (req, res) => {
    try {
        const applications = await Application.find({ userId: req.user._id });
        const analytics = {
            totalApplications: applications.length,
            statusDistribution: {
                applied: applications.filter(app => app.status === 'Applied').length,
                notSelected: applications.filter(app => app.status === 'Not Selected').length,
                selected: applications.filter(app => app.status === 'Selected').length
            }
        };
        res.render('analytics', { 
            analytics,
            page: 'analytics'
        });
    } catch (error) {
        req.flash('error', 'Error loading analytics.');
        res.redirect('/');
    }
});

// Upload resume route
router.post('/upload-resume', isAuthenticated, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            req.flash('error', 'No file uploaded');
            return res.redirect('/');
        }
        req.flash('success', 'Resume uploaded successfully');
        res.redirect('/');
    } catch (error) {
        req.flash('error', 'Error uploading resume.');
        res.redirect('/');
    }
});

// Add application route
router.post('/add-application', isAuthenticated, upload.single('resume'), async (req, res) => {
    try {
        const newApplication = new Application({
            userId: req.user._id,
            title: req.body.title,
            company: req.body.company,
            resume: req.file ? req.file.filename : null,
            jobDescription: req.body.jobDescription,
            status: req.body.status,
            matchPercentage: Math.floor(Math.random() * 30) + 70 // Placeholder for match calculation
        });
        await newApplication.save();
        req.flash('success', 'Application added successfully');
        res.redirect('/');
    } catch (error) {
        req.flash('error', 'Error adding application.');
        res.redirect('/');
    }
});

// Update status route
router.post('/update-status/:id', isAuthenticated, async (req, res) => {
    try {
        const application = await Application.findOne({
            _id: req.params.id,
            userId: req.user._id
        });
        
        if (application) {
            application.status = req.body.status;
            await application.save();
            req.flash('success', 'Status updated successfully');
        }
        res.redirect('/');
    } catch (error) {
        req.flash('error', 'Error updating status.');
        res.redirect('/');
    }
});

module.exports = router; 