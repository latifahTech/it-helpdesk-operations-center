import { useState } from 'react';
import { accentFor, fmtTime } from '../utils';

export default function LogsTable({ logs, loading, error, apiBase, onDelete }) {
  const [expanded, setExpanded] = useState(new Set());

  // Toggle the expanded state of a ticket row
  function toggle(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Generate a visual priority badge for the ticket
  function getPriorityBadge(priority) {
    if (!priority) return null;
    const colors = {
      Critical: { fg: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
      High: { fg: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
      Medium: { fg: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
      Low: { fg: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
    };
    const style = colors[priority] || colors.Medium;
    return (
      <span className="tag" style={{ color: style.fg, background: style.bg, marginRight: '4px' }}>
        {priority}
      </span>
    );
  }

  return (
    <div className="table-panel">
      <table>
        <thead>
          <tr>
            <th style={{ width: 140 }}>Time</th>
            <th style={{ width: 130 }}>Request ID</th>
            <th>Incident Summary</th>
            <th style={{ width: 110 }}>Category</th>
            <th style={{ width: 130 }}>Priority Level</th>
            <th>Asset & Location Details</th>
            <th style={{ width: 44 }}></th>
          </tr>
        </thead>
        <tbody>
          {/* Display table skeletons while loading */}
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <tr className="skeleton-row" key={i}>
                <td colSpan={7}><div className="skel" style={{ width: '100%' }}></div></td>
              </tr>
            ))}

          {/* Display error state when backend requests fail */}
          {!loading && error && (
            <tr>
              <td colSpan={7}>
                <div className="error-state">
                  <div className="glyph">Connection Error</div>
                  <p>Unable to establish connection with the backend server. Please verify the API base URL and ensure the service is running.</p>
                </div>
              </td>
            </tr>
          )}

          {/* Display a message when no tickets match filters */}
          {!loading && !error && logs.length === 0 && (
            <tr>
              <td colSpan={7}>
                <div className="empty-state">
                  <div className="glyph">no tickets</div>
                  <p>Nothing matches this filter. Try clearing the search or switching category.</p>
                </div>
              </td>
            </tr>
          )}

          {/* Render the active ticket list */}
          {!loading &&
            !error &&
            logs.map((ticket) => {
              const a = accentFor(ticket.category || 'UNSET');

              // Safely parse metadata attached to the ticket
              let metaObj = {};
              try {
                metaObj = typeof ticket.metadata === 'string' ? JSON.parse(ticket.metadata) : (ticket.metadata || {});
              } catch {
                metaObj = {};
              }

              const { priority } = metaObj;
              const isExpanded = expanded.has(ticket._id);

              return (
                <tr key={ticket._id}>
                  <td className="cell-time">{fmtTime(ticket.createdAt)}</td>
                  <td className="cell-user">
                    {ticket._id ? `#${ticket._id.slice(-6).toUpperCase()}` : '—'}
                  </td>
                  <td className="cell-action">{ticket.action ?? '—'}</td>
                  <td>
                    <span className="tag" style={{ color: a.fg, background: a.bg }}>
                      {ticket.category ?? '—'}
                    </span>
                  </td>
                  <td>
                    {getPriorityBadge(ticket.priority)}
                  </td>
                  <td className="cell-meta">
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {ticket.device && (
                        <span style={{ fontSize: '11px', padding: '2px 6px', background: 'var(--bg-tag, rgba(255,255,255,0.06))', borderRadius: '4px', border: '1px solid var(--border)' }}>
                          <strong style={{ opacity: 0.7 }}>device:</strong> {ticket.device}
                        </span>
                      )}
                      {ticket.location && (
                        <span style={{ fontSize: '11px', padding: '2px 6px', background: 'var(--bg-tag, rgba(255,255,255,0.06))', borderRadius: '4px', border: '1px solid var(--border)' }}>
                          <strong style={{ opacity: 0.7 }}>location:</strong> {ticket.location}
                        </span>
                      )}
                      {!ticket.device && !ticket.location && '—'}
                    </div>
                  </td>
                  <td>
                    <button className="del-btn" title="Close & Archive Ticket" onClick={() => onDelete(ticket._id)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}