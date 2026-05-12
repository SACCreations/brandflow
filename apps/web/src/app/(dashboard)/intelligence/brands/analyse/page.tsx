'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button, Card, Input, Badge } from '@brandflow/ui';
import { Search, Globe, FileText, Sparkles, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BrandAnalysePage() {
  const router = useRouter();
  const [sources, setSources] = useState<{ id?: string; url: string; status: 'idle' | 'pending' | 'done' | 'error' }[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [step, setStep] = useState<'input' | 'processing' | 'review'>('input');
  const [extractedData, setExtractedData] = useState<any>(null);

  const addSource = () => {
    if (!currentUrl) return;
    setSources([...sources, { url: currentUrl, status: 'idle' }]);
    setCurrentUrl('');
  };

  const removeSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const startAnalysis = async () => {
    setStep('processing');
    
    try {
      // 1. Ingest all sources in parallel
      const ingestedSources = await Promise.all(
        sources.map(async (s) => {
          const res = await apiClient.post('/knowledge/sources', {
            type: 'url',
            sourceUrl: s.url,
          });
          return res.data.data; // Added .data
        })
      );

      // 2. Poll for all sources to be ready (simplified for MVP: just wait)
      await new Promise(r => setTimeout(r, 8000));

      // 3. Trigger batch analysis
      const sourceIds = ingestedSources.map(s => s.id);
      const analysisRes = await apiClient.post('/brands/analyse', { sourceIds });
      
      setExtractedData(analysisRes.data);
      setStep('review');
    } catch (err) {
      console.error('Analysis failed:', err);
      setStep('input');
      alert('Analysis failed. Please check your URLs and try again.');
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.post('/brands', data);
    },
    onSuccess: () => {
      router.push('/intelligence/brands');
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Multi-Source Brand Analyser</h1>
        <p className="text-gray-500 text-lg">Extract identity from multiple websites, docs, and socials for 100% accuracy.</p>
      </div>

      {step === 'input' && (
        <Card className="p-8">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-semibold">Add Knowledge Sources</h2>
              <p className="text-gray-500">The more sources you add, the better the AI understands your brand.</p>
            </div>

            <div className="flex gap-3">
              <Input
                placeholder="https://yourcompany.com, linkedin.com/company/..., etc."
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSource()}
                className="flex-1 h-12 text-lg"
              />
              <Button
                variant="outline"
                size="lg"
                onClick={addSource}
                disabled={!currentUrl}
                className="px-6 h-12 border-brand-200 text-brand-700 hover:bg-brand-50"
              >
                Add Source
              </Button>
            </div>

            {sources.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-gray-100">
                {sources.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg group">
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">{s.url}</span>
                    </div>
                    <button 
                      onClick={() => removeSource(i)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button
              size="lg"
              className="w-full h-14 text-lg font-bold gap-2"
              onClick={startAnalysis}
              disabled={sources.length === 0}
            >
              <Sparkles className="w-5 h-5" />
              Start Comprehensive Analysis
            </Button>

            <div className="flex justify-center gap-6 pt-4 text-xs text-gray-400">
              <span>Supports Website URLs</span>
              <span>•</span>
              <span>Social Media Profiles</span>
              <span>•</span>
              <span>Case Studies</span>
            </div>
          </div>
        </Card>
      )}

      {step === 'processing' && (
        <Card className="p-12 text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin"></div>
            <div className="absolute inset-4 rounded-full bg-brand-50 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-brand-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">AI is Analysing your Brand...</h2>
            <p className="text-gray-500 max-w-sm mx-auto">
              We're reading your website and distilling your unique brand voice. This usually takes 10-20 seconds.
            </p>
          </div>
          <div className="flex flex-col gap-2 max-w-xs mx-auto">
             <div className="flex justify-between text-xs font-medium">
               <span className="text-brand-600">Extracting content...</span>
               <span>75%</span>
             </div>
             <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
               <div className="h-full bg-brand-600 rounded-full animate-pulse" style={{ width: '75%' }}></div>
             </div>
          </div>
        </Card>
      )}

      {step === 'review' && extractedData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600" /> Extracted Positioning
              </h3>
              <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg italic">
                "{extractedData.positioning}"
              </p>
              <div className="space-y-3">
                 <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Primary Audience</h4>
                 <p className="text-gray-600">{extractedData.audience}</p>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-bold">Brand Voice & Tone</h3>
              <div className="flex flex-wrap gap-2">
                {extractedData.tone.map((t: string) => (
                  <Badge key={t} className="px-3 py-1 bg-brand-50 text-brand-700 border-brand-200">
                    {t}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-brand-600 text-white">
              <h3 className="text-lg font-bold mb-2">Ready to launch?</h3>
              <p className="text-brand-100 text-sm mb-6">
                This analysis will create your new brand profile and set your global content guidelines.
              </p>
              <Button
                className="w-full bg-white text-brand-600 hover:bg-brand-50 border-none h-12 text-lg font-bold"
                onClick={() => saveMutation.mutate(extractedData)}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving...' : 'Confirm & Save'}
              </Button>
            </Card>

            <Card className="p-6 border-amber-200 bg-amber-50/30">
               <h4 className="text-amber-800 font-bold mb-2">Governance Detected</h4>
               <ul className="text-sm text-amber-700 space-y-2">
                 {extractedData.governance.bannedPhrases.map((p: string) => (
                   <li key={p} className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Banned: {p}
                   </li>
                 ))}
               </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
