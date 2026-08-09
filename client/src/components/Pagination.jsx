export default function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  const start = Math.max(1, page - 2);
  const end = Math.min(pages, page + 2);
  const nums = [];
  for (let n = start; n <= end; n++) nums.push(n);

  return (
    <nav className="mt-10 flex items-center justify-center gap-1">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
        className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40">
        Prev
      </button>

      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="rounded px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-100">1</button>
          {start > 2 && <span className="px-1 text-gray-400">…</span>}
        </>
      )}

      {nums.map((n) => (
        <button key={n} onClick={() => onPageChange(n)}
          className={`rounded px-3 py-1.5 text-sm ${n === page ? "bg-blue-600 text-white" : "text-gray-900 hover:bg-gray-100"}`}>
          {n}
        </button>
      ))}

      {end < pages && (
        <>
          {end < pages - 1 && <span className="px-1 text-gray-400">…</span>}
          <button onClick={() => onPageChange(pages)} className="rounded px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-100">
            {pages}
          </button>
        </>
      )}

      <button onClick={() => onPageChange(page + 1)} disabled={page >= pages}
        className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40">
        Next
      </button>
    </nav>
  );
}