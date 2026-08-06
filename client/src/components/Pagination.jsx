export default function Pagination({ page, pages, total, onPrev, onNext }) {
  return (
    <div className="pager">
      {/* Show current total and page information */}
      <div className="info">{total != null ? `${total} total tickets · page ${page} of ${pages}` : '—'}</div>
      
      {/* Pagination controls */}
      <div className="controls">
        <button onClick={onPrev} disabled={page <= 1}>&larr; Prev</button>
        <span className="page-current">{page}</span>
        <button onClick={onNext} disabled={page >= pages}>Next &rarr;</button>
      </div>
    </div>
  );
}