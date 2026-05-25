export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Approvals</h1>
          <p className="mt-1 text-sm text-gray-500">Review and approve content before publishing</p>
        </div>
        <div className="flex gap-2">
          {['All', 'Pending', 'Approved', 'Rejected'].map((f) => (
            <button
              key={f}
              className="rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:text-gray-400 transition-colors first:bg-brand-50 first:border-brand-400 first:text-brand-700"
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50">
              {['Content', 'Platform', 'Submitted', 'Reviewer', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">No pending approvals</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
