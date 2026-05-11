export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campaigns</h1>
          <p className="mt-1 text-sm text-gray-500">Organise and track multi-channel campaigns</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          + New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Active', count: 0, color: 'text-green-600' },
          { label: 'Draft', count: 0, color: 'text-yellow-600' },
          { label: 'Completed', count: 0, color: 'text-gray-500' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500">{s.label} Campaigns</p>
            <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-4xl mb-3">◎</p>
        <p className="font-medium text-gray-700 dark:text-gray-300">No campaigns yet</p>
        <p className="mt-1 text-sm text-gray-500">Create your first campaign to start organising content</p>
      </div>
    </div>
  );
}
