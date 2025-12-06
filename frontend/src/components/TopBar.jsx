import './TopBar.css';

function TopBar({
    boardName,
    members,
    selectedMember,
    onMemberChange,
    showTodayOnly,
    onTodayToggle,
    searchQuery,
    onSearchChange,
    onSettingsClick
}) {
    return (
        <header className="top-bar">
            <div className="top-bar-left">
                <h1 className="board-title">{boardName}</h1>
            </div>
            
            <div className="top-bar-center">
                <div className="filter-group">
                    {/* Member filter */}
                    <div className="member-filter">
                        <button
                            className={`filter-pill ${!selectedMember ? 'active' : ''}`}
                            onClick={() => onMemberChange(null)}
                        >
                            All
                        </button>
                        {members.map(member => (
                            <button
                                key={member.id}
                                className={`filter-pill member-pill ${selectedMember === member.id ? 'active' : ''}`}
                                onClick={() => onMemberChange(member.id)}
                                style={{ '--member-color': member.color }}
                            >
                                <span 
                                    className="member-dot"
                                    style={{ backgroundColor: member.color }}
                                />
                                {member.name}
                            </button>
                        ))}
                    </div>

                    {/* Today filter */}
                    <button
                        className={`filter-pill today-pill ${showTodayOnly ? 'active' : ''}`}
                        onClick={onTodayToggle}
                    >
                        <span className="today-icon">☀️</span>
                        Today
                    </button>
                </div>

                {/* Search */}
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search cards..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {searchQuery && (
                        <button 
                            className="search-clear"
                            onClick={() => onSearchChange('')}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div className="top-bar-right">
                <button 
                    className="settings-btn"
                    onClick={onSettingsClick}
                    aria-label="Settings"
                >
                    ⚙️
                </button>
            </div>
        </header>
    );
}

export default TopBar;

