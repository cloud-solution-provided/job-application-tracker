import React, { useState, useEffect } from 'react';

const JobTracker = () => {
    const [applications, setApplications] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showJDModal, setShowJDModal] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [expandedDescription, setExpandedDescription] = useState(null);
    const [formData, setFormData] = useState({
        company: '',
        title: '',
        description: '',
        resume: null,
        status: 'Applied',
        matchScore: {
            percentage: 0,
            details: {}
        }
    });

    const statusOptions = [
        { value: 'Wishlist', label: 'Wishlist' },
        { value: 'Applied', label: 'Applied' },
        { value: 'Interviewing', label: 'Interviewing' },
        { value: 'Offer', label: 'Offer' },
        { value: 'Rejected', label: 'Rejected' },
        { value: 'Withdrawn', label: 'Withdrawn' }
    ];

    useEffect(() => {
        fetchApplications();
    }, [selectedStatus]);

    const fetchApplications = async () => {
        try {
            const url = selectedStatus === 'all' 
                ? '/api/applications' 
                : `/api/applications?status=${selectedStatus}`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setApplications(data);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                resume: file
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formDataToSend = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null) {
                if (key === 'matchScore') {
                    formDataToSend.append(key, JSON.stringify(formData[key]));
                } else {
                    formDataToSend.append(key, formData[key]);
                }
            }
        });

        try {
            const response = await fetch('/api/applications', {
                method: 'POST',
                body: formDataToSend
            });

            if (response.ok) {
                const newApplication = await response.json();
                setApplications(prev => [newApplication, ...prev]);
                setShowAddModal(false);
                setFormData({
                    company: '',
                    title: '',
                    description: '',
                    resume: null,
                    status: 'Applied',
                    matchScore: {
                        percentage: 0,
                        details: {}
                    }
                });
            }
        } catch (error) {
            console.error('Error submitting application:', error);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const response = await fetch(`/api/applications/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                const updatedApplication = await response.json();
                setApplications(prev =>
                    prev.map(app =>
                        app._id === id ? updatedApplication : app
                    )
                );
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleExpandDescription = async (id) => {
        if (expandedDescription === id) {
            setExpandedDescription(null);
            return;
        }

        try {
            const response = await fetch(`/api/applications/${id}/description`);
            if (response.ok) {
                const { description } = await response.json();
                setApplications(prev =>
                    prev.map(app =>
                        app._id === id 
                            ? { ...app, description: { ...app.description, full: description } }
                            : app
                    )
                );
                setExpandedDescription(id);
            }
        } catch (error) {
            console.error('Error fetching full description:', error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Wishlist': 'var(--primary-color)',
            'Applied': 'var(--warning-color)',
            'Interviewing': 'var(--info-color)',
            'Offer': 'var(--success-color)',
            'Rejected': 'var(--danger-color)',
            'Withdrawn': 'var(--secondary-color)'
        };
        return colors[status] || 'var(--primary-color)';
    };

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-4">
                    <h1 className="text-dark mb-0">My Applications</h1>
                    <select 
                        className="form-select form-select-sm w-auto"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="d-flex gap-3">
                    <button 
                        className="btn btn-outline-primary"
                        onClick={() => setShowUploadModal(true)}
                    >
                        <i className="bi bi-upload me-2"></i>
                        Upload Resume
                    </button>
                    <button 
                        className="btn btn-outline-secondary"
                        onClick={() => setShowJDModal(true)}
                    >
                        <i className="bi bi-file-text me-2"></i>
                        Paste Job Description
                    </button>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowAddModal(true)}
                    >
                        <i className="bi bi-plus-lg me-2"></i>
                        Add Application
                    </button>
                </div>
            </div>

            <div className="card shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>Company / Position</th>
                                    <th>Description</th>
                                    <th>Resume</th>
                                    <th>Status</th>
                                    <th>Match Score</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map(app => (
                                    <tr key={app._id}>
                                        <td>
                                            <div className="d-flex flex-column">
                                                <span className="fw-bold">{app.company}</span>
                                                <span className="text-muted">{app.title}</span>
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: '300px' }}>
                                            <div className="position-relative">
                                                <div className={`description-content ${expandedDescription === app._id ? 'expanded' : ''}`}>
                                                    {expandedDescription === app._id 
                                                        ? app.description?.full 
                                                        : app.description?.truncated || 'No description available'}
                                                </div>
                                                {app.description?.full && (
                                                    <button 
                                                        className="btn btn-link btn-sm p-0 mt-1"
                                                        onClick={() => handleExpandDescription(app._id)}
                                                    >
                                                        {expandedDescription === app._id ? 'Show Less' : 'Show More'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {app.resume?.fileUrl ? (
                                                <a 
                                                    href={app.resume.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm btn-outline-primary"
                                                >
                                                    <i className="bi bi-file-pdf me-2"></i>
                                                    View
                                                </a>
                                            ) : (
                                                <span className="text-muted">No resume</span>
                                            )}
                                        </td>
                                        <td>
                                            <select
                                                className="form-select form-select-sm w-auto"
                                                value={app.status}
                                                onChange={(e) => handleStatusChange(app._id, e.target.value)}
                                                style={{
                                                    backgroundColor: `${getStatusColor(app.status)}15`,
                                                    color: getStatusColor(app.status),
                                                    borderColor: `${getStatusColor(app.status)}30`
                                                }}
                                            >
                                                {statusOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td style={{ width: '200px' }}>
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="progress flex-grow-1" style={{ height: '8px' }}>
                                                    <div
                                                        className="progress-bar"
                                                        role="progressbar"
                                                        style={{
                                                            width: `${app.matchScore?.percentage || 0}%`,
                                                            backgroundColor: (app.matchScore?.percentage || 0) >= 70 ? 'var(--success-color)' :
                                                                          (app.matchScore?.percentage || 0) >= 40 ? 'var(--warning-color)' : 
                                                                          'var(--danger-color)'
                                                        }}
                                                        aria-valuenow={app.matchScore?.percentage || 0}
                                                        aria-valuemin="0"
                                                        aria-valuemax="100"
                                                    />
                                                </div>
                                                <span className="text-muted small">{app.matchScore?.percentage || 0}%</span>
                                            </div>
                                            {app.matchScore?.details && (
                                                <div className="match-details small text-muted mt-1">
                                                    <div>Skills: {app.matchScore.details.skillsMatch || 0}%</div>
                                                    <div>Experience: {app.matchScore.details.experienceMatch || 0}%</div>
                                                    {app.matchScore.details.educationMatch !== undefined && (
                                                        <div>Education: {app.matchScore.details.educationMatch}%</div>
                                                    )}
                                                    {app.matchScore.details.keywordsMatch !== undefined && (
                                                        <div>Keywords: {app.matchScore.details.keywordsMatch}%</div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="btn-group">
                                                <button className="btn btn-sm btn-outline-secondary">
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger">
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Upload Resume Modal */}
            {showUploadModal && (
                <div className="modal fade show" style={{ display: 'block' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Upload Resume</h5>
                                <button type="button" className="btn-close" onClick={() => setShowUploadModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">Resume File</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleFileChange}
                                            required
                                        />
                                        <small className="text-muted">Supported formats: PDF, DOC, DOCX</small>
                                    </div>
                                    <div className="d-flex justify-content-end gap-2">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            Upload
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Application Modal */}
            {showAddModal && (
                <div className="modal fade show" style={{ display: 'block' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add New Application</h5>
                                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">Company</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="company"
                                            value={formData.company}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Position</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Job Description</label>
                                        <textarea
                                            className="form-control"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="4"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Resume</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="Applied">Applied</option>
                                            <option value="Not Selected">Not Selected</option>
                                            <option value="Selected">Selected</option>
                                        </select>
                                    </div>
                                    <div className="d-flex justify-content-end gap-2">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            Add Application
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Paste JD Modal */}
            {showJDModal && (
                <div className="modal fade show" style={{ display: 'block' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Paste Job Description</h5>
                                <button type="button" className="btn-close" onClick={() => setShowJDModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">Job Description</label>
                                        <textarea
                                            className="form-control"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="6"
                                            required
                                        />
                                    </div>
                                    <div className="d-flex justify-content-end gap-2">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowJDModal(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            Save
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Backdrop */}
            {(showUploadModal || showAddModal || showJDModal) && (
                <div className="modal-backdrop fade show"></div>
            )}
        </div>
    );
};

export default JobTracker; 