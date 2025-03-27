const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Application = require('../models/Application');
const { isAuthenticated } = require('../middleware/auth');
const { uploadFile } = require('../../utils/s3Utils');

// Configure multer for memory storage (for S3 upload)
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Helper function to truncate text
const truncateText = (text, maxLength = 200) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
};

// Get all applications for the authenticated user
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const query = { user: req.user._id };
        if (req.query.status && req.query.status !== 'all') {
            query.status = req.query.status;
        }

        const applications = await Application.find(query)
            .select('company title status description.truncated resume matchScore createdAt updatedAt')
            .sort('-updatedAt');

        res.json(applications);
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ message: 'Error fetching applications' });
    }
});

// Get full description for a specific application
router.get('/:id/description', isAuthenticated, async (req, res) => {
    try {
        const application = await Application.findOne({
            _id: req.params.id,
            user: req.user._id
        }).select('description.full');

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.json({ description: application.description.full });
    } catch (error) {
        console.error('Error fetching application description:', error);
        res.status(500).json({ message: 'Error fetching application description' });
    }
});

// Create a new application
router.post('/', isAuthenticated, upload.single('resume'), async (req, res) => {
    try {
        const { company, title, description, status } = req.body;
        let matchScore = req.body.matchScore ? JSON.parse(req.body.matchScore) : {
            percentage: 0,
            details: {
                skillsMatch: 0,
                experienceMatch: 0,
                educationMatch: 0,
                keywordsMatch: 0
            }
        };

        let resumeData = null;
        if (req.file) {
            try {
                const key = `resumes/${req.user._id}/${Date.now()}-${req.file.originalname}`;
                const fileUrl = await uploadFile(key, req.file);
                resumeData = {
                    fileName: req.file.originalname,
                    fileUrl: fileUrl,
                    uploadDate: new Date(),
                    s3Key: key
                };
            } catch (error) {
                console.error('Error uploading resume to S3:', error);
                // Continue without the resume if upload fails
            }
        }

        const application = new Application({
            user: req.user._id,
            company,
            title,
            description: {
                full: description,
                truncated: truncateText(description)
            },
            status,
            matchScore,
            resume: resumeData,
            timeline: [{
                status: status,
                date: new Date(),
                notes: 'Application created'
            }]
        });

        await application.save();
        res.status(201).json(application);
    } catch (error) {
        console.error('Error creating application:', error);
        res.status(500).json({ message: 'Error creating application' });
    }
});

// Update an application
router.patch('/:id', isAuthenticated, upload.single('resume'), async (req, res) => {
    try {
        const updates = {};
        const allowedUpdates = ['company', 'title', 'description', 'status', 'matchScore'];
        
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                if (key === 'description') {
                    updates['description.full'] = req.body.description;
                    updates['description.truncated'] = truncateText(req.body.description);
                } else if (key === 'matchScore') {
                    updates.matchScore = typeof req.body.matchScore === 'string' 
                        ? JSON.parse(req.body.matchScore)
                        : req.body.matchScore;
                } else {
                    updates[key] = req.body[key];
                }
            }
        });

        if (req.file) {
            try {
                const key = `resumes/${req.user._id}/${Date.now()}-${req.file.originalname}`;
                const fileUrl = await uploadFile(key, req.file);
                updates.resume = {
                    fileName: req.file.originalname,
                    fileUrl: fileUrl,
                    uploadDate: new Date(),
                    s3Key: key
                };
            } catch (error) {
                console.error('Error uploading resume to S3:', error);
                // Continue without updating resume if upload fails
            }
        }

        // Add status change to timeline if status is being updated
        if (updates.status) {
            updates.$push = {
                timeline: {
                    status: updates.status,
                    date: new Date(),
                    notes: 'Status updated'
                }
            };
        }

        const application = await Application.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            updates,
            { new: true }
        );

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.json(application);
    } catch (error) {
        console.error('Error updating application:', error);
        res.status(500).json({ message: 'Error updating application' });
    }
});

// Delete an application
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const application = await Application.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.json({ message: 'Application deleted successfully' });
    } catch (error) {
        console.error('Error deleting application:', error);
        res.status(500).json({ message: 'Error deleting application' });
    }
});

module.exports = router; 