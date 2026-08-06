import { useEffect, useState } from 'react';
import { fmtTime } from '../utils';

const ACTION_LABELS = { DELETE_TICKET: 'deleted', RESTORE_TICKET: 'restored' };

export default function AuditPanel({ open, onClose, authFetch, onUnauthorized, onRestored }) {
  const [filter, setFilter] = useState('ALL');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState(null);

  // Fetch audit entries using the current action filter and fixed result limit.
  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (filter !== 'ALL') params.set('action', filter === 'DELETE' ? 'DELETE_TICKET' : 'RESTORE_TICKET');
      
      const res = await authFetch('/api/audit?' + params.toString());
      if (res.status === 401) { onUnauthorized(); return; }
      if (!res.ok) throw new Error('request failed');
      
      const json = await res.json();
      setEntries(json.data || []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  // Refresh audit entries when the panel opens or the filter changes.
  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filter]);

  // Restore a deleted ticket and refresh the audit history on success.
  async function handleRestore(id) {
    setRestoringId(id);
    try {
      const res = await authFetch('/api/tickets/' + id + '/restore', { method: 'POST' });
      if (res.status === 401) { onUnauthorized(); return; }
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Restore failed');
      
      onRestored();
      load();
    } catch (err) {
      onRestored(err.message, true);
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div
      className={`overlay ${open ? 'open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" style={{ display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
        <h2>Audit trail</h2>
        <p className="modal-sub">Every ticket deletion and restoration, with who did it and when.</p>
        
        {/* Filter toolbar */}
        <div className="audit-toolbar">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="ALL">All actions</option>
            <option value="DELETE">Deletes only</option>
            <option value="RESTORE">Restores only</option>
          </select>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>

        {/* Audit entries list with scroll support */}
        <div className="audit-list" style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {loading && <div className="audit-empty">loading&hellip;</div>}
          {!loading && entries.length === 0 && <div className="audit-empty">no activity recorded yet</div>}
          
          {!loading &&
            entries.map((e) => {
              const snap = e.snapshot || {};
              const actionType = e.action === 'DELETE_TICKET' ? 'DELETE' : 'RESTORE';
              
              return (
                <div className="audit-row" key={e._id}>
                  <div className="audit-row-top">
                    <span className={`audit-action-tag ${actionType}`}>{actionType}</span>
                    <span className="audit-time">{fmtTime(e.createdAt)}</span>
                  </div>
                  
                  <div className="audit-meta">
                    <b>{e.performedBy}</b> {ACTION_LABELS[e.action] || e.action.toLowerCase()} the{' '}
                    <b>{snap.category ?? 'ticket'}</b> issue "{snap.action ?? '—'}" by user <b>{snap.userId ?? '—'}</b>
                  </div>
                  
                  {/* Only show restore control for deleted tickets */}
                  {e.action === 'DELETE_TICKET' && (
                    <div className="audit-row-actions">
                      <button
                        className="btn-restore"
                        disabled={restoringId === e.targetId}
                        onClick={() => handleRestore(e.targetId)}
                      >
                        {restoringId === e.targetId ? 'Restoring…' : 'Restore this ticket'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}