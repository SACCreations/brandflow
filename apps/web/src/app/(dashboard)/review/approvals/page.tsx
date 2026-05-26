export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Approvals</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review and approve content before publishing</p>
        </div>
        <div className="flex gap-2">
          {['All', 'Pending', 'Approved', 'Rejected'].map((f) => (
            <button
              key={f}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-brand-400 hover:text-primary border-border text-muted-foreground transition-colors first:bg-primary/10 first:border-brand-400 first:text-brand-700"
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background border-border bg-background overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead>
            <tr className="bg-surface-2">
              {['Content', 'Platform', 'Submitted', 'Reviewer', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">No pending approvals</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
