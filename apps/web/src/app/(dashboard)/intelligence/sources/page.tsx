'use client';

import React, { useState } from 'react';
import { 
  Globe, 
  FileText, 
  Link as LinkIcon, 
  MoreVertical, 
  RefreshCw, 
  Pause, 
  Trash2, 
  ExternalLink,
  Plus,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import AddSourceModal from '@/components/knowledge/add-source-modal';

export default function SourcesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sources = [
    { id: 1, name: 'Main Website', type: 'url', url: 'processdrive.com', status: 'active', entries: 428, health: 0.98, trust: 'high', lastSync: '1h ago' },
    { id: 2, name: 'Brand Guidelines', type: 'pdf', url: 'brand_v2.pdf', status: 'active', entries: 156, health: 0.92, trust: 'high', lastSync: '2d ago' },
    { id: 3, name: 'Product Specs', type: 'docx', url: 'v4_specs.docx', status: 'active', entries: 89, health: 0.85, trust: 'medium', lastSync: '5h ago' },
    { id: 4, name: 'Marketing Notion', type: 'api', url: 'notion.so/mktg', status: 'failed', entries: 0, health: 0.0, trust: 'high', lastSync: '15m ago' },
    { id: 5, name: 'Competitor RSS', type: 'rss', url: 'competitor.com/feed', status: 'paused', entries: 12, health: 0.75, trust: 'low', lastSync: '1w ago' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Knowledge Sources</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Manage connections and ingestion pipelines for your brand brain.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Connect Source
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Source</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Entries</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Health</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Trust</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Last Sync</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {sources.map((source) => (
                <tr key={source.id} className="group transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {source.type === 'url' ? <Globe className="h-5 w-5" /> :
                         source.type === 'pdf' ? <FileText className="h-5 w-5" /> :
                         source.type === 'api' ? <LinkIcon className="h-5 w-5" /> :
                         <FileText className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{source.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{source.url}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {source.status === 'active' ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Active
                        </span>
                      ) : source.status === 'failed' ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                          <XCircle className="h-3.5 w-3.5" /> Failed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                          <Pause className="h-3.5 w-3.5" /> Paused
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                    {source.entries}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div 
                          className={`h-full ${source.health > 0.9 ? 'bg-emerald-500' : source.health > 0.5 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${source.health * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-500">{(source.health * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight ${
                      source.trust === 'high' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10' :
                      source.trust === 'medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-500/10'
                    }`}>
                      <Shield className="h-3 w-3" />
                      {source.trust}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {source.lastSync}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddSourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
