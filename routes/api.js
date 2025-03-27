const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { isAuthenticated } = require('../middleware/auth');
const Application = require('../models/Application');
const { generateSignedUrl } = require('../utils/s3Utils');

// Configure S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Configure multer for handling file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const ext = '.' + file.originalname.split('.').pop().toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Get all applications for the current user
router.get('/applications', isAuthenticated, async (req, res) => {
    try {
        const applications = await Application.find({ user: req.user._id })
            .sort({ applicationDate: -1 });
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching applications', error: error.message });
    }
});

// Create a new application with optional resume upload
router.post('/applications', isAuthenticated, upload.single('resume'), async (req, res) => {
    try {
        const { company, title, description, status } = req.body;
        const application = new Application({
            user: req.user._id,
            company,
            title,
            description,
            status: status || 'Applied',
            matchPercentage: Math.floor(Math.random() * 30) + 70 // Placeholder for AI match calculation
        });

        // Handle resume upload if present
        if (req.file) {
            const fileExt = '.' + req.file.originalname.split('.').pop().toLowerCase();
            const s3Key = `resumes/${req.user._id}/${Date.now()}-${req.file.originalname}`;

            const uploadParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
                ACL: 'private'
            };

            await s3Client.send(new PutObjectCommand(uploadParams));

            // Generate a signed URL that expires in 1 hour
            const getSignedUrlParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key,
                Expires: 3600 // URL expires in 1 hour
            };

            const signedUrl = await generateSignedUrl(s3Client, new GetObjectCommand(getSignedUrlParams), { expiresIn: 3600 });

            application.resume = {
                fileName: req.file.originalname,
                fileUrl: signedUrl,
                uploadDate: new Date(),
                s3Key: s3Key
            };
        }

        await application.save();
        res.status(201).json(application);
    } catch (error) {
        console.error('Error creating application:', error);
        res.status(500).json({ message: 'Error creating application', error: error.message });
    }
});

// Update application status
router.patch('/applications/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const application = await Application.findOneAndUpdate(
            { _id: id, user: req.user._id },
            { status },
            { new: true }
        );

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.json(application);
    } catch (error) {
        res.status(500).json({ message: 'Error updating application', error: error.message });
    }
});

// Delete application
router.delete('/applications/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const application = await Application.findOne({ _id: id, user: req.user._id });

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Delete resume from S3 if it exists
        if (application.resume && application.resume.s3Key) {
            const deleteParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: application.resume.s3Key
            };
            await s3Client.send(new DeleteObjectCommand(deleteParams));
        }

        await application.deleteOne();
        res.json({ message: 'Application deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting application', error: error.message });
    }
});

module.exports = router; 