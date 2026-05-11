export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Publishing Calendar</h1>
        <p className="mt-1 text-sm text-gray-500">Scheduled posts across all platforms</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-gray-500">No scheduled posts yet.</p>
      </div>
    </div>
  );
}
