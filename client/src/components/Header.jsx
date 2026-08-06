export default function Header({ apiBase, onApiBaseChange, connStatus, actor, onOpenAudit, onRefresh, refreshing, onSignOut }) {
  return (
    <header className="top">
      {/* Brand logo and current connection status */}
      <div className="brand">
        <span className={`dot ${connStatus === 'ok' ? 'live' : connStatus === 'down' ? 'down' : ''}`}></span>
        <div>
          <h1>IT Helpdesk & Operations Center</h1>
          <div className="sub">live ticket stream</div>
        </div>
      </div>

      {/* Connection controls, actions, and active session info */}
      <div className="conn">
        <input
          value={apiBase}
          onChange={(e) => onApiBaseChange(e.target.value)}
          spellCheck={false}
        />
        
        {/* Open system audit log modal */}
        <button className="icon-btn" title="View System Audit Log" onClick={onOpenAudit}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
        </button>

        {/* Refresh live dashboard data */}
        <button className={`icon-btn ${refreshing ? 'spinning' : ''}`} title="Refresh Live Data" onClick={onRefresh}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </button>

        {/* Active session details and sign-out control */}
        <div className="session">
          <span className="session-name">Active Session: <strong>{actor}</strong></span>
          <button className="signout-btn" onClick={onSignOut}>Sign out</button>
        </div>
      </div>
    </header>
  );
}