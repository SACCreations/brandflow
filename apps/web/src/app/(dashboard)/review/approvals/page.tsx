export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Approvals</h1>
        <p className="mt-1 text-sm text-gray-500">Review and approve content before publishing</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-gray-500">No pending approvals.</p>
      </div>
    </div>
  );
}
