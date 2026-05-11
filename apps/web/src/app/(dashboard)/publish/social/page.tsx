export default function SocialAccountsPage() {
  const platforms = [
    { id: 'linkedin', label: 'LinkedIn', icon: 'in', color: 'bg-blue-700', desc: 'Company pages & personal profiles' },
    { id: 'instagram', label: 'Instagram', icon: 'IG', color: 'bg-pink-600', desc: 'Posts, Stories & Reels' },
    { id: 'twitter', label: 'X / Twitter', icon: 'X', color: 'bg-gray-900', desc: 'Tweets & threads' },
    { id: 'facebook', label: 'Facebook', icon: 'f', color: 'bg-blue-600', desc: 'Pages & groups' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Social Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">Connect your social media accounts to enable publishing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {platforms.map((p) => (
          <div key={p.id} className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-lg ${p.color} flex items-center justify-center text-white text-sm font-bold`}>
                {p.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{p.label}</p>
                <p className="text-xs text-gray-500">{p.desc}</p>
              </div>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-brand-400 hover:text-brand-600 transition-colors">
              Connect
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Connected Accounts</h2>
        </div>
        <div className="p-8 text-center text-sm text-gray-500">
          No social accounts connected yet
        </div>
      </div>
    </div>
  );
}
