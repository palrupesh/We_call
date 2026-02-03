function Notifications({ notifications, onAccept, onMarkRead, hideTitle = false }) {
    return (
        <section className="card">
            {!hideTitle && <h2>Notifications</h2>}
            <div className="list">
                {notifications.map((notification) => (
                    <div key={notification._id} className="list-item">
                        <div>
                            <strong>{notification.type.replaceAll("_", " ")}</strong>
                            <p className="muted">{notification.message}</p>
                        </div>
                        <div className="actions">
                            {notification.type === "contact_request" && notification?.data?.accepted && (
                                <span className="status accepted">Accepted</span>
                            )}
                            {notification.type === "contact_request" && !notification?.data?.accepted && (
                                <button
                                    className="btn"
                                    onClick={() =>
                                        onAccept(notification?.data?.contactId)
                                    }
                                >
                                    Accept
                                </button>
                            )}
                            {!notification.read && !notification?.data?.accepted && (
                                <button
                                    className="btn secondary"
                                    onClick={() => onMarkRead(notification._id)}
                                >
                                    Mark read
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {!notifications.length && (
                    <p className="muted">No notifications.</p>
                )}
            </div>
        </section>
    );
}

export default Notifications;
