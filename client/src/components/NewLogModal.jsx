import { useEffect, useState } from 'react';

export default function NewLogModal({ open, onClose, onSubmit, categories = [] }) {
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [device, setDevice] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  // Reset form fields whenever the modal opens
  useEffect(() => {
    if (open) {
      setAction('');
      setCategory('');
      setPriority('Medium');
      setDevice('');
      setLocation('');
      setError('');
    }
  }, [open]);

  // Prepare and submit new ticket data to the parent handler
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const meta = {};
    if (device.trim()) meta.device = device.trim();
    if (location.trim()) meta.location = location.trim();
    meta.priority = priority;

    try {
      await onSubmit({
        action: action.trim(),
        category: category.trim(),
        metadata: meta,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  const redDot = <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>;

  return (
    <div
      className={`overlay ${open ? 'open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <h2>New support ticket</h2>
        <p className="modal-sub">Create a new corporate IT or maintenance request.</p>

        {/* Ticket creation form */}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Issue Summary / Title {redDot}</label>
            <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. VPN connection failure" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="field">
              <label>Category {redDot}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} required style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'inherit', borderRadius: '4px' }}>
                <option value="" disabled>Select category</option>
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Network">Network</option>
                <option value="Security">Security</option>
                <option value="General">General</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Priority Level {redDot}</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} required style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'inherit', borderRadius: '4px' }}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="field">
              <label>Device / System</label>
              <input value={device} onChange={(e) => setDevice(e.target.value)} placeholder="e.g. MacBook Pro / Windows" />
            </div>
            <div className="field">
              <label>Location / Office</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Floor 3 / Remote" />
            </div>
          </div>

          {/* Display error message if save fails */}
          {error && <div className="form-error" style={{ display: 'block' }}>{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save ticket</button>
          </div>
        </form>
      </div>
    </div>
  );
}