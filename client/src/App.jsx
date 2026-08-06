import { useCallback, useEffect, useRef, useState } from 'react';
import LoginGate from './components/LoginGate';
import Header from './components/Header';
import StatsPanel from './components/StatsPanel';
import Toolbar from './components/Toolbar';
import LogsTable from './components/LogsTable';
import Pagination from './components/Pagination';
import NewLogModal from './components/NewLogModal';
import AuditPanel from './components/AuditPanel';
import ToastContainer from './components/ToastContainer';

const LIMIT = 10;

export default function App() {
  const [apiBase, setApiBase] = useState(
    import.meta.env.API_URL || 'http://localhost:5000'
  );
  const [session, setSession] = useState(null);
  const [loginError, setLoginError] = useState('');

  const [connStatus, setConnStatus] = useState('idle');
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    totalLogs: 0,
    categoryStats: [],
    dailyActivity: [],
  });
  const [knownCategories, setKnownCategories] = useState([]);

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(null);

  const [category, setCategory] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [showNewLog, setShowNewLog] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  const [toasts, setToasts] = useState([]);

  // Queue a transient notification and remove it automatically
  const addToast = useCallback((msg, err) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, err }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  // Wrap fetch to include API authentication and actor metadata
  const authFetch = useCallback(
    async (path, options = {}) => {
      return fetch(apiBase.replace(/\/$/, '') + path, {
        ...options,
        headers: {
          ...(options.headers || {}),
          'x-api-key': session?.apiKey || '',
          'x-actor': session?.actor || '',
        },
      });
    },
    [apiBase, session]
  );

  // Clear session state when authentication fails

  const handleUnauthorized = useCallback(() => {
    setSession(null);
    setLoginError('Invalid API key. Check the value in your .env and try again.');
  }, []);

  // Load dashboard analytics and expand category metadata
  const loadStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (category !== 'ALL') params.set('category', category);

      const res = await authFetch('/api/tickets/stats?' + params.toString());
      if (res.status === 401) { handleUnauthorized(); return; }
      if (!res.ok) throw new Error('stats failed');
      const json = await res.json();
      const s = json.stats || {};
      setConnStatus('ok');
      setStats(s);
      setKnownCategories((prev) => {
        const set = new Set(prev);
        (s.categoryStats || []).forEach((c) => set.add(c.category));
        return [...set].sort();
      });
    } catch {
      setConnStatus('down');
    }
  }, [authFetch, category, handleUnauthorized]);

  // Retrieve tickets with pagination, category, and search filters
  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError(false);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (category !== 'ALL') params.set('category', category);
    if (search) params.set('search', search);

    try {
      const res = await authFetch('/api/tickets?' + params.toString());
      if (res.status === 401) { handleUnauthorized(); return; }
      if (!res.ok) throw new Error('request failed');
      const json = await res.json();
      setConnStatus('ok');
      setLogs(json.data || []);
      const pg = json.pagination || {};
      setTotalPages(pg.pages || 1);
      setTotal(pg.total ?? 0);
    } catch {
      setConnStatus('down');
      setLogsError(true);
      setLogs([]);
      setTotal(null);
    } finally {
      setLogsLoading(false);
    }
  }, [authFetch, page, category, search, handleUnauthorized]);

  // Debounce search input changes
  const searchTimer = useRef(null);
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput]);

  // Refresh analytics whenever the session or category changes
  useEffect(() => {
    if (!session) return;
    loadStats();
  }, [session, apiBase, category, loadStats]);

  // Refresh ticket list whenever the session or query parameters change
  useEffect(() => {
    if (!session) return;
    loadLogs();
  }, [session, apiBase, page, category, search, loadLogs]);

  // Poll the analytics endpoint periodically while authenticated
  useEffect(() => {
    if (!session) return;
    const id = setInterval(loadStats, 30000);
    return () => clearInterval(id);
  }, [session, loadStats]);

  // Manually refresh all dashboard data
  function handleRefresh() {
    setRefreshing(true);
    Promise.all([loadStats(), loadLogs()]).finally(() => setTimeout(() => setRefreshing(false), 400));
  }

  // Authenticate and surface backend validation errors
  async function handleLogin(apiKey, actor) {
    setLoginError('');
    try {
      // Test the credentials against the backend API
      const res = await fetch(apiBase.replace(/\/$/, '') + '/api/tickets/stats', {
        headers: {
          'x-api-key': apiKey,
          'x-actor': actor,
        },
      });

      const json = await res.json();

      if (!res.ok) {
        // Surface the backend authentication error message
        setLoginError(json.error || 'Invalid or missing access code. Please check your key and try again.');
        return;
      }

      // Preserve session state on successful authentication
      setSession({ apiKey, actor });
    } catch {
      setLoginError('Unable to connect to the server. Please check your connection.');
    }
  }

  // Terminate the current session
  function handleSignOut() {
    setSession(null);
    setLoginError('');
  }

  // Submit a new ticket to the backend
  async function handleCreateLog(payload) {
    const res = await authFetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expired'); }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to save ticket');
    addToast('Ticket created');
    setPage(1);
    loadLogs();
    loadStats();
  }

  // Soft-delete the selected ticket and update the dashboard
  async function handleDelete(id) {
    if (!window.confirm('Close this ticket? It moves to the audit trail and can be restored from there.')) return;
    try {
      const res = await authFetch('/api/tickets/' + id, { method: 'DELETE' });
      if (res.status === 401) { handleUnauthorized(); return; }
      if (!res.ok) throw new Error('delete failed');
      addToast('Ticket closed');
      loadLogs();
      loadStats();
    } catch {
      addToast('Could not delete ticket', true);
    }
  }

  // Process audit panel events and refresh dashboard data
  function handleAuditFeedback(errMsg, isErr) {
    if (isErr) {
      addToast(errMsg, true);
    } else {
      addToast('Ticket restored');
      loadLogs();
      loadStats();
    }
  }

  if (!session) {
    return <LoginGate error={loginError} onSubmit={handleLogin} />;
  }

  return (
    <div className="shell">
      <Header
        apiBase={apiBase}
        onApiBaseChange={setApiBase}
        connStatus={connStatus}
        actor={session.actor}
        onOpenAudit={() => setShowAudit(true)}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onSignOut={handleSignOut}
      />

      <StatsPanel stats={stats} />

      <Toolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        category={category}
        onCategoryChange={(c) => { setCategory(c); setPage(1); }}
        categories={knownCategories}
        onNewLog={() => setShowNewLog(true)}
      />

      <LogsTable
        logs={logs}
        loading={logsLoading}
        error={logsError}
        apiBase={apiBase}
        onDelete={handleDelete}
        onCompleteAndDelete={handleDelete}
      />

      <Pagination
        page={page}
        pages={totalPages}
        total={total}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />

      <NewLogModal open={showNewLog} onClose={() => setShowNewLog(false)} onSubmit={handleCreateLog} />

      <AuditPanel
        open={showAudit}
        onClose={() => setShowAudit(false)}
        authFetch={authFetch}
        onUnauthorized={handleUnauthorized}
        onRestored={handleAuditFeedback}
      />

      <ToastContainer toasts={toasts} />
    </div>
  );
}