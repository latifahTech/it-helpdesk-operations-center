export default function Toolbar({ search, onSearchChange, category, onCategoryChange, categories, onNewLog }) {
  return (
    <div className="toolbar">
      {/* Search input field */}
      <div className="search-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by user ID, technician, or issue summary&hellip;"
        />
      </div>

      {/* Category filter dropdown */}
      <select className="btn btn-ghost" value={category} onChange={(e) => onCategoryChange(e.target.value)}>
        <option value="ALL">All Incident Categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Button to open the new ticket modal */}
      <button className="btn btn-primary" onClick={onNewLog}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        New ticket
      </button>
    </div>
  );
}