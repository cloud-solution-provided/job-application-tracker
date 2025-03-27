import React, { useState } from 'react';

const ResumeUpload = () => {
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setUploadStatus('Please select a file');
            return;
        }

        const formData = new FormData();
        formData.append('resume', file);

        try {
            setUploadStatus('Uploading...');
            const response = await fetch('/api/resume/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            
            if (response.ok) {
                setUploadStatus('Upload successful! File URL: ' + data.fileUrl);
            } else {
                setUploadStatus('Upload failed: ' + data.message);
            }
        } catch (error) {
            setUploadStatus('Error uploading file: ' + error.message);
        }
    };

    return (
        <div className="resume-upload">
            <h2>Test Resume Upload</h2>
            <form onSubmit={handleUpload}>
                <div>
                    <input 
                        type="file" 
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx"
                    />
                </div>
                <button type="submit">Upload Resume</button>
            </form>
            {uploadStatus && (
                <div className="upload-status">
                    <p>{uploadStatus}</p>
                </div>
            )}
        </div>
    );
};

export default ResumeUpload; 