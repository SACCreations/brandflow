'use client';

import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Globe, 
  FileText, 
  Upload,
  Layout,
  Database,
  Cloud,
  Check,
  ChevronRight,
  ArrowLeft,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

type SourceType = 'web' | 'file' | 'integration' | 'api' | null;

interface BrandOption {
  id: string;
  name: string;
}

interface SourceFormSharedProps {
  brandId: string;
  brands: BrandOption[];
  isBrandsLoading: boolean;
  setBrandId: (brandId: string) => void;
}

function inferFileSourceType(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') {
    return 'pdf';
  }

  if (extension === 'doc' || extension === 'docx') {
    return 'docx';
  }

  return 'text';
}

export default function AddSourceModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<SourceType>(null);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { data: brands = [], isLoading: isBrandsLoading } = useQuery<BrandOption[]>({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await apiClient.get<BrandOption[]>('/brands');
      return response.data;
    },
    enabled: isOpen,
    staleTime: 60_000,
  });

  if (!isOpen) return null;

  const reset = () => {
    setStep(1);
    setSelectedType(null);
    setSelectedBrandId('');
    setSuccess(false);
    onClose();
  };

  const handleSourceCreated = () => {
    void queryClient.invalidateQueries({ queryKey: ['knowledge-stats'] });
    setSuccess(true);
    setTimeout(reset, 2000);
  };

  const sharedFormProps: SourceFormSharedProps = {
    brandId: selectedBrandId,
    brands,
    isBrandsLoading,
    setBrandId: setSelectedBrandId,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={reset}
          className="absolute right-6 top-6 rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {success ? (
          <div className="p-12 text-center flex flex-col items-center justify-center animate-in zoom-in duration-300">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10">
              <Check className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ingestion Started!</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Your knowledge source is being processed in the background.</p>
          </div>
        ) : (
          <>
            {step === 1 && (
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connect Knowledge Source</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Select how you want to ingest knowledge into your brand brain.</p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <SourceOption 
                    icon={<Globe className="h-6 w-6 text-blue-500" />}
                    title="Website / URL"
                    description="Crawl websites, sitemaps, or RSS feeds automatically."
                    onClick={() => { setSelectedType('web'); setStep(2); }}
                  />
                  <SourceOption 
                    icon={<Upload className="h-6 w-6 text-brand-500" />}
                    title="File Upload"
                    description="Upload PDF, DOCX, or CSV documents directly."
                    onClick={() => { setSelectedType('file'); setStep(2); }}
                  />
                  <SourceOption 
                    icon={<Cloud className="h-6 w-6 text-emerald-500" />}
                    title="Integrations"
                    description="Connect Notion, Google Drive, or Confluence."
                    onClick={() => { setSelectedType('integration'); setStep(2); }}
                  />
                  <SourceOption 
                    icon={<Database className="h-6 w-6 text-purple-500" />}
                    title="Direct API / Text"
                    description="Push raw text data or connect via custom API."
                    onClick={() => { setSelectedType('api'); setStep(2); }}
                  />
                </div>
              </div>
            )}

            {step === 2 && selectedType === 'web' && (
              <WebSourceForm onBack={() => setStep(1)} onSuccess={handleSourceCreated} {...sharedFormProps} />
            )}

            {step === 2 && selectedType === 'file' && (
              <FileSourceForm onBack={() => setStep(1)} onSuccess={handleSourceCreated} {...sharedFormProps} />
            )}

            {step === 2 && selectedType === 'integration' && (
              <IntegrationSourceForm onBack={() => setStep(1)} onSuccess={handleSourceCreated} />
            )}

            {step === 2 && selectedType === 'api' && (
              <ApiSourceForm onBack={() => setStep(1)} onSuccess={handleSourceCreated} {...sharedFormProps} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BrandSelector({ brandId, brands, isBrandsLoading, setBrandId }: SourceFormSharedProps) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
        Attach to brand
      </label>
      <select
        value={brandId}
        onChange={(event) => setBrandId(event.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
      >
        <option value="">{isBrandsLoading ? 'Loading brands…' : 'Select a brand'}</option>
        {brands.map((brand) => (
          <option key={brand.id} value={brand.id}>
            {brand.name}
          </option>
        ))}
      </select>
      {!isBrandsLoading && brands.length === 0 ? (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Create a brand first before adding knowledge sources.
        </p>
      ) : null}
    </div>
  );
}

function SourceOption({ icon, title, description, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="group flex flex-col items-start rounded-2xl border border-gray-200 bg-white p-6 text-left transition-all hover:border-brand-500 hover:shadow-xl hover:shadow-brand-500/5 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-brand-500"
    >
      <div className="mb-4 rounded-xl bg-gray-50 p-3 transition-colors group-hover:bg-brand-50 dark:bg-gray-800 dark:group-hover:bg-brand-500/10">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
      <div className="mt-4 flex items-center gap-1 text-xs font-bold text-brand-600 opacity-0 transition-opacity group-hover:opacity-100 uppercase tracking-wider">
        Setup <ChevronRight className="h-3 w-3" />
      </div>
    </button>
  );
}

function WebSourceForm({ onBack, onSuccess, brandId, brands, isBrandsLoading, setBrandId }: any) {
  const [method, setMethod] = useState('single');
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!brandId) return setError('Please select a brand');
    if (!url) return setError('Please enter a URL');
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post('/knowledge/sources', {
        brandId,
        name: url.split('/')[2] || url,
        type: 'url',
        sourceUrl: url,
        trustLevel: 'high',
        syncFrequency: method === 'single' ? 'manual' : 'daily',
        metadata: { method, depth: 1 },
        config: { method, depth: 1 },
      });

      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to connect source');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to selection
      </button>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Website Ingestion</h2>
      <p className="mt-2 text-gray-500 dark:text-gray-400">Extract intelligence from live web content.</p>

      <div className="mt-8 flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {['single', 'sitemap', 'rss'].map((m) => (
          <button 
            key={m}
            onClick={() => setMethod(m)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize ${method === m ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500'}`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <BrandSelector brandId={brandId} brands={brands} isBrandsLoading={isBrandsLoading} setBrandId={setBrandId} />
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {method === 'single' ? 'Enter URL' : method === 'sitemap' ? 'Sitemap XML URL' : 'RSS Feed URL'}
          </label>
          <input 
            type="url" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/..." 
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-500/10">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="mt-10 flex justify-end gap-3">
        <button onClick={onBack} className="px-6 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">Cancel</button>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || isBrandsLoading || brands.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Start Ingestion'}
        </button>
      </div>
    </div>
  );
}

function FileSourceForm({ onBack, onSuccess, brandId, brands, isBrandsLoading, setBrandId }: any) {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    const firstFile = files[0];
    if (!brandId) return setError('Please select a brand');
    if (!firstFile) return setError('Please select a file');
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post('/knowledge/sources', {
        brandId,
        name: firstFile.name,
        type: inferFileSourceType(firstFile.name),
        sourceUrl: `file://${encodeURIComponent(firstFile.name)}`,
        trustLevel: 'high',
        metadata: {
          fileName: firstFile.name,
          fileSize: firstFile.size,
          mimeType: firstFile.type || 'application/octet-stream',
        },
        config: {
          fileName: firstFile.name,
          uploadPending: true,
        },
      });

      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to ingest file');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to selection
      </button>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Documents</h2>
      <p className="mt-2 text-gray-500 dark:text-gray-400">PDF, DOCX, CSV, and TXT files supported.</p>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        multiple 
      />

      <div className="mt-8 space-y-4">
        <BrandSelector brandId={brandId} brands={brands} isBrandsLoading={isBrandsLoading} setBrandId={setBrandId} />
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-12 dark:border-gray-800 dark:bg-gray-800/30 transition-all hover:border-brand-500 hover:bg-brand-50/10 group cursor-pointer"
      >
        <div className="rounded-full bg-white p-4 shadow-sm dark:bg-gray-800 group-hover:scale-110 transition-transform">
          <Upload className="h-8 w-8 text-brand-600" />
        </div>
        <p className="mt-6 text-sm font-bold text-gray-900 dark:text-white">
          {files.length > 0 ? `${files.length} file(s) selected` : 'Click to upload or drag and drop'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {files.length > 0 ? files.map(f => f.name).join(', ') : 'PDF, DOCX, CSV up to 50MB'}
        </p>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-500/10">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="mt-10 flex justify-end gap-3">
        <button onClick={onBack} className="px-6 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">Cancel</button>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || files.length === 0 || isBrandsLoading || brands.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload and Ingest'}
        </button>
      </div>
    </div>
  );
}

function ApiSourceForm({ onBack, onSuccess, brandId, brands, isBrandsLoading, setBrandId }: any) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!brandId) return setError('Please select a brand');
    if (!name || !content) return setError('Please fill all fields');
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post('/knowledge/sources', {
        brandId,
        name,
        type: 'text',
        text: content,
        trustLevel: 'high',
        metadata: { inputMode: 'manual' },
      });

      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to save knowledge');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to selection
      </button>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Direct Knowledge Input</h2>
      <p className="mt-2 text-gray-500 dark:text-gray-400">Paste raw text, snippets, or connect custom data.</p>

      <div className="mt-8 space-y-4">
        <BrandSelector brandId={brandId} brands={brands} isBrandsLoading={isBrandsLoading} setBrandId={setBrandId} />
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Reference Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q4 Competitor Analysis" 
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Knowledge Content</label>
          <textarea 
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste text here..." 
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-500/10">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="mt-10 flex justify-end gap-3">
        <button onClick={onBack} className="px-6 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">Cancel</button>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || isBrandsLoading || brands.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Knowledge'}
        </button>
      </div>
    </div>
  );
}

function IntegrationSourceForm({ onBack, onSuccess }: any) {
  const integrations = [
    { name: 'Notion', icon: <Database className="h-5 w-5" />, status: 'popular' },
    { name: 'Google Drive', icon: <Cloud className="h-5 w-5" />, status: 'available' },
    { name: 'Confluence', icon: <FileText className="h-5 w-5" />, status: 'available' },
    { name: 'Airtable', icon: <Layout className="h-5 w-5" />, status: 'coming soon' },
  ];

  return (
    <div className="p-8">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to selection
      </button>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Integrations</h2>
      <p className="mt-2 text-gray-500 dark:text-gray-400">Sync knowledge from your existing tools.</p>

      <div className="mt-8 space-y-3">
        {integrations.map((app) => (
          <button 
            key={app.name}
            disabled={app.status === 'coming soon'}
            onClick={() => app.status !== 'coming soon' && onSuccess()}
            className={`flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 transition-all dark:border-gray-800 dark:bg-gray-900/50 ${
              app.status === 'coming soon' ? 'opacity-50 grayscale' : 'hover:border-brand-500 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-gray-50 p-2.5 dark:bg-gray-800">{app.icon}</div>
              <span className="font-bold text-gray-900 dark:text-white">{app.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{app.status}</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

