import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Layout from './components/Layout';
import JobTracker from './components/JobTracker';
import Login from './components/Login';

const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if user is already logged in
        fetch('/auth/me')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Not authenticated');
                }
                return res.json();
            })
            .then(data => {
                setUser(data);
            })
            .catch(err => {
                console.log('Not authenticated:', err.message);
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
    };

    const handleProfileUpdate = (updatedUser) => {
        setUser(updatedUser);
    };

    const handleLogout = async () => {
        try {
            const response = await fetch('/auth/logout', { method: 'POST' });
            if (response.ok) {
                setUser(null);
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Error logging out:', error);
            setError('Failed to log out. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <Layout onLogout={handleLogout} user={user}>
            <JobTracker user={user} onProfileUpdate={handleProfileUpdate} />
        </Layout>
    );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />); 