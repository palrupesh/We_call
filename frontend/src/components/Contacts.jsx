function Contacts({ contacts, onStartCall }) {
    return (
        <section className="card">
            <h2>Contacts</h2>
            <div className="list">
                {contacts.map((contact) => (
                    <div key={contact._id} className="list-item">
                        <div>
                            <strong>
                                {contact.contactUserId?.displayName ||
                                    contact.contactUserId?.username}
                            </strong>
                            <p className="muted">{contact.contactUserId?.status}</p>
                        </div>
                        <div className="actions">
                            <button
                                className="btn small"
                                onClick={() => onStartCall(contact.contactUserId?._id, "video")}
                            >
                                Video
                            </button>
                            <button
                                className="btn small secondary"
                                onClick={() => onStartCall(contact.contactUserId?._id, "audio")}
                            >
                                Audio
                            </button>
                        </div>
                    </div>
                ))}
                {!contacts.length && (
                    <p className="muted">No contacts yet.</p>
                )}
            </div>
        </section>
    );
}

export default Contacts;
