import React from 'react';

const Layout = ({ children, user, onLogout }) => {
    return (
        <div className="app-container">
            <header className="app-header">
                <div className="header-left">
                    <h1>Job Application Tracker</h1>
                </div>
                <div className="header-right">
                    {user && (
                        <>
                            <a href="/profile" className="profile-link">
                                <span className="user-name">{user.profile?.name || user.email}</span>
                            </a>
                            <button className="logout-btn" onClick={onLogout}>
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </header>
            <main className="app-main">
                {children}
            </main>
            <footer className="app-footer">
                <p>&copy; 2024 Job Application Tracker. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Layout; 