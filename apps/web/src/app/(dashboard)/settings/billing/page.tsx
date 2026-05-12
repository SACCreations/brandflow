export default function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Billing & Subscription</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your plan and token usage.</p>
      </div>
      <div className="p-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-center">
        <p className="text-gray-500">Billing integration (Stripe) is planned for Phase 1 Layer 0.</p>
      </div>
    </div>
  );
}
