export default function CalendarPage() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + totalDays }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Publishing Calendar</h1>
          <p className="mt-1 text-sm text-gray-500">Scheduled posts across all platforms</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          + Schedule Post
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">{monthName} {year}</h2>
          <div className="flex gap-2">
            <button className="rounded border border-gray-200 dark:border-gray-700 px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">‹ Prev</button>
            <button className="rounded border border-gray-200 dark:border-gray-700 px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Next ›</button>
          </div>
        </div>
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-gray-800">
          {days.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">{d}</div>
          ))}
          {cells.map((day, i) => (
            <div
              key={i}
              className={`min-h-[80px] p-2 text-sm ${
                day === now.getDate() ? 'bg-brand-50 dark:bg-brand-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
              }`}
            >
              {day !== null && (
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  day === now.getDate() ? 'bg-brand-600 text-white' : 'text-gray-500'
                }`}>{day}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
