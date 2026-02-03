function CallHistory({ calls, onEndCall }) {
    return (
        <section className="card">
            <h2>Call history</h2>
            <div className="list">
                {calls.map((call) => (
                    <div key={call._id} className="list-item">
                        <div>
                            <strong>{call.type}</strong>
                            <p className="muted">
                                {call.status} • {new Date(call.startedAt).toLocaleString()}
                            </p>
                        </div>
                        {call.status !== "ended" && (
                            <button
                                className="btn secondary"
                                onClick={() => onEndCall(call.callId || call._id)}
                            >
                                End log
                            </button>
                        )}
                    </div>
                ))}
                {!calls.length && (
                    <p className="muted">No call history yet.</p>
                )}
            </div>
        </section>
    );
}

export default CallHistory;
