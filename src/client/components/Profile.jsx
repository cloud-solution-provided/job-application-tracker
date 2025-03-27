import React, { useState } from 'react';

const Profile = ({ user, onProfileUpdate }) => {
    const [formData, setFormData] = useState({
        name: user?.profile?.name || '',
        title: user?.profile?.title || '',
        location: user?.profile?.location || '',
        skills: user?.profile?.skills?.join(', ') || '',
    });

    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/auth/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    skills: formData.skills.split(',').map(skill => skill.trim()).filter(Boolean)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile');
            }

            onProfileUpdate(data);
            setSuccess('Profile updated successfully!');
            setIsEditing(false);
        } catch (error) {
            setError(error.message);
        }
    };

    if (!isEditing) {
        return (
            <div className="profile-view">
                <div className="profile-header">
                    <h2>Profile</h2>
                    <button className="edit-btn" onClick={() => setIsEditing(true)}>
                        Edit Profile
                    </button>
                </div>
                <div className="profile-info">
                    <p><strong>Name:</strong> {user?.profile?.name}</p>
                    <p><strong>Title:</strong> {user?.profile?.title || 'Not set'}</p>
                    <p><strong>Location:</strong> {user?.profile?.location || 'Not set'}</p>
                    <p><strong>Skills:</strong> {user?.profile?.skills?.join(', ') || 'Not set'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-edit">
            <h2>Edit Profile</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="title">Professional Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g. Software Engineer"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g. San Francisco, CA"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="skills">Skills (comma-separated)</label>
                    <input
                        type="text"
                        id="skills"
                        name="skills"
                        value={formData.skills}
                        onChange={handleInputChange}
                        placeholder="e.g. JavaScript, React, Node.js"
                    />
                </div>

                <div className="button-group">
                    <button type="submit" className="save-btn">Save Changes</button>
                    <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Profile; 