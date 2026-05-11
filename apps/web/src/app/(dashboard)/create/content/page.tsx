export default function ContentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content</h1>
          <p className="mt-1 text-sm text-gray-500">Generate and manage AI-powered content</p>
        </div>
        <a
          href="/create/content"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Generate Content
        </a>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-gray-500">No content yet. Click &quot;Generate Content&quot; to get started.</p>
      </div>
    </div>
  );
}
