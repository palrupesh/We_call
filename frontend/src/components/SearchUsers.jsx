function SearchUsers({ query, results, onQueryChange, onSearch, onAddContact }) {
    return (
        <section className="card">
            <h2>Search users</h2>
            <div className="row">
                <input
                    placeholder="Search by username or email"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                />
                <button className="btn secondary" onClick={onSearch}>
                    Search
                </button>
            </div>
            <div className="list">
                {results.map((result) => (
                    <div key={result._id} className="list-item">
                        <div>
                            <strong>{result.displayName || result.username}</strong>
                            <p className="muted">{result.email}</p>
                        </div>
                        <button
                            className="btn"
                            onClick={() => onAddContact(result._id)}
                        >
                            Add
                        </button>
                    </div>
                ))}
                {!results.length && (
                    <p className="muted">Search results will appear here.</p>
                )}
            </div>
        </section>
    );
}

export default SearchUsers;
