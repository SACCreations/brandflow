export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Track content performance and engagement across platforms</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Reach', value: '—', delta: null, icon: '◎' },
          { label: 'Impressions', value: '—', delta: null, icon: '◉' },
          { label: 'Engagement Rate', value: '—', delta: null, icon: '⚡' },
          { label: 'Avg Quality Score', value: '—', delta: null, icon: '✦' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{kpi.label}</p>
              <span className="text-brand-500">{kpi.icon}</span>
            </div>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Events by Source</h2>
            <select className="text-xs border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent text-gray-500">
              <option>Last 30 days</option>
              <option>Last 7 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <div className="p-8 text-center text-sm text-gray-400">
            No data yet — publish content to see analytics
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Performance Metrics</h2>
          </div>
          <div className="p-8 text-center text-sm text-gray-400">
            Connect social accounts to see performance data
          </div>
        </div>
      </div>

      {/* Top content table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Top Performing Content</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50">
              {['Content', 'Platform', 'Reach', 'Engagement', 'CTR', 'Quality'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                No performance data available yet
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
