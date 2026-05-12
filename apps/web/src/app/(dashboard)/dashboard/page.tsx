export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Your brand performance at a glance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Content Created', value: '—', icon: '✦', color: 'text-brand-600' },
          { label: 'Pending Approvals', value: '—', icon: '✓', color: 'text-yellow-600' },
          { label: 'Posts Scheduled', value: '—', icon: '◷', color: 'text-blue-600' },
          { label: 'Token Usage', value: '—', icon: '⊞', color: 'text-purple-600' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <span className={stat.color}>{stat.icon}</span>
            </div>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
          </div>
          <div className="p-8 text-center text-gray-500 text-sm">No recent activity</div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Generate Content', href: '/create/content', icon: '✦' },
              { label: 'New Campaign', href: '/campaigns', icon: '◎' },
              { label: 'View Approvals', href: '/review/approvals', icon: '✓' },
              { label: 'Schedule Post', href: '/publish/calendar', icon: '◷' },
            ].map((a) => (
              <a
                key={a.label}
                href={a.href}
                className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-brand-400 hover:text-brand-600 transition-colors"
              >
                <span>{a.icon}</span>
                {a.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

