const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // Index for faster user-based queries
    },
    company: {
        type: String,
        required: true,
        trim: true,
        index: true // Index for company name searches
    },
    title: {
        type: String,
        required: true,
        trim: true,
        index: true // Index for job title searches
    },
    description: {
        full: {
            type: String,
            required: true,
            trim: true
        },
        truncated: {
            type: String,
            trim: true
        }
    },
    status: {
        type: String,
        enum: ['Wishlist', 'Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn'],
        default: 'Applied',
        index: true // Index for status-based filtering
    },
    resume: {
        fileName: String,
        fileUrl: String,
        uploadDate: Date,
        s3Key: String,
        summary: {
            type: String,
            trim: true
        }
    },
    matchScore: {
        percentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        details: {
            skillsMatch: Number,
            experienceMatch: Number,
            educationMatch: Number,
            keywordsMatch: Number
        }
    },
    timeline: [{
        status: String,
        date: {
            type: Date,
            default: Date.now
        },
        notes: String
    }],
    metadata: {
        salary: {
            min: Number,
            max: Number,
            currency: {
                type: String,
                default: 'USD'
            }
        },
        location: {
            type: String,
            trim: true
        },
        jobType: {
            type: String,
            enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'],
            default: 'Full-time'
        },
        source: {
            type: String,
            trim: true
        }
    },
    nextSteps: [{
        action: String,
        dueDate: Date,
        completed: {
            type: Boolean,
            default: false
        }
    }],
    contacts: [{
        name: String,
        role: String,
        email: String,
        phone: String,
        notes: String
    }]
}, {
    timestamps: true
});

// Indexes for efficient querying
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ 'matchScore.percentage': -1 });
applicationSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware to generate truncated description
applicationSchema.pre('save', function(next) {
    if (this.isModified('description.full')) {
        this.description.truncated = this.description.full.substring(0, 200) + '...';
    }
    next();
});

// Instance method to get full description
applicationSchema.methods.getFullDescription = function() {
    return this.description.full;
};

// Static method to get applications by status
applicationSchema.statics.getByStatus = function(userId, status) {
    return this.find({ user: userId, status })
              .select('-description.full') // Exclude full description by default
              .sort('-createdAt');
};

// Static method to get application statistics
applicationSchema.statics.getStats = function(userId) {
    return this.aggregate([
        { $match: { user: mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgMatchScore: { $avg: '$matchScore.percentage' }
            }
        }
    ]);
};

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application; 