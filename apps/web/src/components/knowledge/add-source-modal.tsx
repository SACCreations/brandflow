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

function inferFileSourceType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':  return 'pdf';
    case 'doc':
    case 'docx': return 'docx';
    case 'xls':
    case 'xlsx': return 'xlsx';
    case 'csv':  return 'csv';
    case 'ppt':
    case 'pptx': return 'pptx';
    case 'txt':  return 'txt';
    default:     return 'text';
  }
}

function inferFileMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc:  'application/msword',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls:  'application/vnd.ms-excel',
    csv:  'text/csv',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ppt:  'application/vnd.ms-powerpoint',
    txt:  'text/plain',
  };
  return map[ext ?? ''] ?? 'application/octet-stream';
}

export default function AddSourceModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [selectedType, setSelectedType] = useState<SourceType>('web');
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
    setSelectedType('web');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" role="dialog" aria-modal="true" aria-labelledby="add-source-title">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-background shadow-2xl bg-background border border-border animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={reset}
          aria-label="Close dialog"
          className="absolute right-6 top-6 rounded-full p-2 text-muted-foreground hover:bg-surface-2 dark:hover:bg-surface-1 transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {success ? (
          <div className="p-12 text-center flex flex-col items-center justify-center animate-in zoom-in duration-300">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10">
              <Check className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Ingestion Started!</h2>
            <p className="mt-2 text-muted-foreground">Your knowledge source is being processed in the background.</p>
          </div>
        ) : (
          <>
            <div className="p-8">
              <h2 id="add-source-title" className="text-2xl font-bold text-foreground">Add Knowledge Source</h2>
              <p className="mt-2 text-muted-foreground">Select how you want to ingest knowledge into your brand brain.</p>

              {/* Tabs */}
              <div className="mt-6 flex gap-2 border-b border-border pb-2 border-border overflow-x-auto scrollbar-none">
                {[
                  { id: 'web', label: 'Website URL', icon: Globe },
                  { id: 'file', label: 'File Upload', icon: Upload },
                  { id: 'integration', label: 'Integrations', icon: Cloud },
                  { id: 'api', label: 'Direct Text / API', icon: Database },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedType(tab.id as SourceType)}
                    className={`flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-[9px] ${
                      selectedType === tab.id
                        ? 'border-primary text-primary dark:text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground dark:hover:text-gray-300'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedType === 'web' && (
              <WebSourceForm onSuccess={handleSourceCreated} {...sharedFormProps} />
            )}

            {selectedType === 'file' && (
              <FileSourceForm onSuccess={handleSourceCreated} {...sharedFormProps} />
            )}

            {selectedType === 'integration' && (
              <IntegrationSourceForm onSuccess={handleSourceCreated} />
            )}

            {selectedType === 'api' && (
              <ApiSourceForm onSuccess={handleSourceCreated} {...sharedFormProps} />
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
      <label className="block text-sm font-bold text-foreground mb-2">
        Attach to brand
      </label>
      <select
        value={brandId}
        onChange={(event) => setBrandId(event.target.value)}
        className="w-full rounded-xl border border-border bg-surface-1 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 border-border bg-surface-2 text-foreground"
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
      className="group flex flex-col items-start rounded-2xl border border-border bg-background p-6 text-left transition-all hover:border-primary hover:shadow-xl hover:shadow-brand-500/5 border-border bg-background/50 dark:hover:border-primary"
    >
      <div className="mb-4 rounded-xl bg-surface-1 bg-background p-3 transition-colors group-hover:bg-primary/10 bg-surface-2 dark:group-hover:bg-primary/100/10">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
      <div className="mt-4 flex items-center gap-1 text-xs font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100 uppercase tracking-wider">
        Setup <ChevronRight className="h-3 w-3" />
      </div>
    </button>
  );
}

function WebSourceForm({ onSuccess, brandId, brands, isBrandsLoading, setBrandId }: any) {
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
    <div className="p-8 pt-0">

      <h2 className="text-2xl font-bold text-foreground">Website Ingestion</h2>
      <p className="mt-2 text-muted-foreground">Extract intelligence from live web content.</p>

      <div className="mt-8 flex gap-2 p-1 bg-surface-3 rounded-xl w-fit">
        {['single', 'sitemap', 'rss'].map((m) => (
          <button 
            key={m}
            onClick={() => setMethod(m)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize ${method === m ? 'bg-background text-primary shadow-sm bg-surface-3 text-foreground' : 'text-muted-foreground'}`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <BrandSelector brandId={brandId} brands={brands} isBrandsLoading={isBrandsLoading} setBrandId={setBrandId} />
        <div>
          <label className="block text-sm font-bold text-foreground mb-2">
            {method === 'single' ? 'Enter URL' : method === 'sitemap' ? 'Sitemap XML URL' : 'RSS Feed URL'}
          </label>
          <input 
            type="url" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/..." 
            className="w-full rounded-xl border border-border bg-surface-1 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 border-border bg-surface-2 text-foreground"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-500/10">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="mt-10 flex justify-end gap-3">
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || isBrandsLoading || brands.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-2.5 text-sm font-semibold text-foreground shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Start Ingestion'}
        </button>
      </div>
    </div>
  );
}

function FileSourceForm({ onSuccess, brandId, brands, isBrandsLoading, setBrandId }: any) {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const validateAndSetFiles = (fileList: File[]) => {
    const oversized = fileList.filter(f => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setError(`File(s) exceed 50MB limit: ${oversized.map(f => f.name).join(', ')}`);
      return;
    }
    setError(null);
    setFiles(fileList);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndSetFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      validateAndSetFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = async () => {
    const firstFile = files[0];
    if (!brandId) return setError('Please select a brand');
    if (!firstFile) return setError('Please select a file');
    setIsSubmitting(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64Data = e.target?.result as string;

        await apiClient.post('/knowledge/sources', {
          brandId,
          name: firstFile.name,
          type: inferFileSourceType(firstFile.name),
          sourceUrl: `file://${encodeURIComponent(firstFile.name)}`,
          text: base64Data,
          trustLevel: 'high',
          metadata: {
            fileName: firstFile.name,
            fileSize: firstFile.size,
            mimeType: inferFileMimeType(firstFile.name) || firstFile.type || 'application/octet-stream',
          },
        });

        onSuccess();
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || 'Failed to ingest file');
        setIsSubmitting(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
      setIsSubmitting(false);
    };

    reader.readAsDataURL(firstFile);
  };


  return (
    <div className="p-8 pt-0">

      <h2 className="text-2xl font-bold text-foreground">Upload Documents</h2>
      <p className="mt-2 text-muted-foreground">PDF, DOCX, CSV, and TXT files supported.</p>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt"
        multiple 
      />


      <div className="mt-8 space-y-4">
        <BrandSelector brandId={brandId} brands={brands} isBrandsLoading={isBrandsLoading} setBrandId={setBrandId} />
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all group cursor-pointer ${
          isDragging 
            ? 'border-primary bg-brand-50/20 dark:bg-brand-900/20' 
            : 'border-border bg-surface-1 dark:bg-gray-950/50 border-border bg-surface-2/30 hover:border-primary hover:bg-brand-50/10'
        }`}
      >
        <div className="rounded-full bg-background p-4 shadow-sm bg-surface-2 group-hover:scale-110 transition-transform">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        <p className="mt-6 text-sm font-bold text-foreground">
          {files.length > 0 ? `${files.length} file(s) selected` : 'Click to upload or drag and drop'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {files.length > 0 ? files.map(f => f.name).join(', ') : 'PDF, DOCX, XLSX, CSV, PPTX, TXT — up to 50MB each'}
        </p>

      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-500/10">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="mt-10 flex justify-end gap-3">
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || files.length === 0 || isBrandsLoading || brands.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-2.5 text-sm font-semibold text-foreground shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload and Ingest'}
        </button>
      </div>
    </div>
  );
}

function ApiSourceForm({ onSuccess, brandId, brands, isBrandsLoading, setBrandId }: any) {
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
    <div className="p-8 pt-0">

      <h2 className="text-2xl font-bold text-foreground">Direct Knowledge Input</h2>
      <p className="mt-2 text-muted-foreground">Paste raw text, snippets, or connect custom data.</p>

      <div className="mt-8 space-y-4">
        <BrandSelector brandId={brandId} brands={brands} isBrandsLoading={isBrandsLoading} setBrandId={setBrandId} />
        <div>
          <label className="block text-sm font-bold text-foreground mb-2">Reference Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q4 Competitor Analysis" 
            className="w-full rounded-xl border border-border bg-surface-1 bg-background px-4 py-3 text-sm border-border bg-surface-2 text-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-foreground mb-2">Knowledge Content</label>
          <textarea 
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste text here..." 
            className="w-full rounded-xl border border-border bg-surface-1 bg-background px-4 py-3 text-sm border-border bg-surface-2 text-foreground"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-500/10">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="mt-10 flex justify-end gap-3">
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || isBrandsLoading || brands.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-2.5 text-sm font-semibold text-foreground shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Knowledge'}
        </button>
      </div>
    </div>
  );
}

function IntegrationSourceForm({ onSuccess }: any) {
  const integrations = [
    { name: 'Notion', icon: <Database className="h-5 w-5" />, status: 'popular' },
    { name: 'Google Drive', icon: <Cloud className="h-5 w-5" />, status: 'available' },
    { name: 'Confluence', icon: <FileText className="h-5 w-5" />, status: 'available' },
    { name: 'Airtable', icon: <Layout className="h-5 w-5" />, status: 'coming soon' },
  ];

  return (
    <div className="p-8 pt-0">

      <h2 className="text-2xl font-bold text-foreground">Integrations</h2>
      <p className="mt-2 text-muted-foreground">Sync knowledge from your existing tools.</p>

      <div className="mt-8 space-y-3">
        {integrations.map((app) => (
          <button 
            key={app.name}
            disabled={app.status === 'coming soon'}
            onClick={() => app.status !== 'coming soon' && onSuccess()}
            className={`flex w-full items-center justify-between rounded-2xl border border-border/60 bg-background p-4 transition-all border-border bg-background/50 ${
              app.status === 'coming soon' ? 'opacity-50 grayscale' : 'hover:border-primary hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-surface-1 bg-background p-2.5 bg-surface-2">{app.icon}</div>
              <span className="font-bold text-foreground">{app.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{app.status}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

