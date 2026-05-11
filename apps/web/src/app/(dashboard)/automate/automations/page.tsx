export default function AutomationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Automations</h1>
          <p className="mt-1 text-sm text-gray-500">Build event-driven workflows to automate your brand operations</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          + New Automation
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: 'Active', count: 0, icon: '⚡', color: 'text-green-600' },
          { label: 'Paused', count: 0, icon: '⏸', color: 'text-yellow-600' },
          { label: 'Runs today', count: 0, icon: '▶', color: 'text-blue-600' },
          { label: 'Failures', count: 0, icon: '✕', color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500">{s.icon} {s.label}</p>
            <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Available Triggers</h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Content Approved', desc: 'Fires when a content item is approved', icon: '✓' },
            { name: 'Schedule Due', desc: 'Fires when a publish schedule is due', icon: '◷' },
            { name: 'Campaign Created', desc: 'Fires when a new campaign is created', icon: '◎' },
            { name: 'Quality Score Low', desc: 'Fires when quality score drops below threshold', icon: '⚠' },
            { name: 'Knowledge Stale', desc: 'Fires when a knowledge source becomes stale', icon: '◉' },
            { name: 'Manual Trigger', desc: 'Trigger manually or via webhook', icon: '⊞' },
          ].map((t) => (
            <div key={t.name} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:border-brand-400 hover:shadow-sm transition-all">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-brand-600">{t.icon}</span>
                <span className="font-medium text-sm text-gray-900 dark:text-white">{t.name}</span>
              </div>
              <p className="text-xs text-gray-500">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-4xl mb-3">⚡</p>
        <p className="font-medium text-gray-700 dark:text-gray-300">No automations configured</p>
        <p className="mt-1 text-sm text-gray-500">Pick a trigger above or click &quot;New Automation&quot; to build your first flow</p>
      </div>
    </div>
  );
}
