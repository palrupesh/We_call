function Header({ user, onLogout, notificationCount, onToggleNotifications }) {
    return (
        <header className="topbar">
            <div className="brand">
                <h1>WeCall</h1>
                <p className="subtitle">One-to-one audio & video calls</p>
            </div>
            {user && (
                <div className="topbar-actions">
                    <button className="icon-btn" onClick={onToggleNotifications} aria-label="Notifications">
                        <span className="icon">🔔</span>
                        {notificationCount > 0 && (
                            <span className="badge">{notificationCount}</span>
                        )}
                    </button>
                    <div className="user-chip">
                        <div>
                            <p className="label">Signed in as</p>
                            <strong>{user.displayName || user.username}</strong>
                        </div>
                        <button className="btn secondary" onClick={onLogout}>
                            Log out
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;
