const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    password: {
        type: String,
        required: true
    },
    profile: {
        firstName: {
            type: String,
            trim: true
        },
        lastName: {
            type: String,
            trim: true
        },
        title: {
            type: String,
            trim: true
        },
        skills: [{
            name: String,
            level: {
                type: String,
                enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
                default: 'Intermediate'
            }
        }],
        experience: [{
            title: String,
            company: String,
            startDate: Date,
            endDate: Date,
            current: Boolean,
            description: String
        }],
        education: [{
            school: String,
            degree: String,
            field: String,
            graduationDate: Date
        }],
        location: {
            city: String,
            state: String,
            country: String
        },
        preferences: {
            jobTypes: [{
                type: String,
                enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote']
            }],
            industries: [String],
            desiredSalary: {
                min: Number,
                max: Number,
                currency: {
                    type: String,
                    default: 'USD'
                }
            },
            locations: [String]
        }
    },
    settings: {
        emailNotifications: {
            applicationUpdates: {
                type: Boolean,
                default: true
            },
            newMatches: {
                type: Boolean,
                default: true
            },
            deadlineReminders: {
                type: Boolean,
                default: true
            }
        },
        privacy: {
            profileVisibility: {
                type: String,
                enum: ['Public', 'Private', 'Connections'],
                default: 'Private'
            }
        },
        theme: {
            type: String,
            enum: ['Light', 'Dark', 'System'],
            default: 'System'
        }
    }
}, {
    timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
    const profile = this.toObject();
    delete profile.password;
    delete profile.settings;
    return profile;
};

// Static method to find users by skill
userSchema.statics.findBySkill = function(skillName) {
    return this.find({
        'profile.skills.name': skillName
    }).select('-password');
};

const User = mongoose.model('User', userSchema);

module.exports = User; 