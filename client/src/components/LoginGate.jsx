import { useState } from 'react';

export default function LoginGate({ error, onSubmit }) {
  const [apiKey, setApiKey] = useState('');
  const [actor, setActor] = useState('');

  // Handle login submission and avoid empty credentials
  function handleSubmit(e) {
    e.preventDefault();
    if (!apiKey.trim() || !actor.trim()) return;
    onSubmit(apiKey.trim(), actor.trim());
  }

  return (
    <div className="overlay open" id="loginOverlay">
      <div className="modal">
        <div className="login-lock">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h2>Sign in</h2>
        <p className="modal-sub">Please authenticate to access the IT Helpdesk console and audit logs.</p>
        
        {/* Authentication form */}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Employee ID / Username</label>
            <input
              type="text"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="e.g., m.latifah"
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          
          {/* Display error message when authentication fails */}
          {error && <div className="form-error" style={{ display: 'block' }}>{error}</div>}
          
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}