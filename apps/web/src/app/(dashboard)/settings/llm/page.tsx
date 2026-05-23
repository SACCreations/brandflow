'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateLlmSettingsSchema, type UpdateLlmSettingsDto } from '@brandflow/shared';
import { apiClient } from '@/lib/api-client';
import { Button, Card, Input, Badge } from '@brandflow/ui';
import { Cpu, Key, ShieldCheck, Sparkles, AlertCircle, Save } from 'lucide-react';

export default function LlmSettingsPage() {
  const queryClient = useQueryClient();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{success: boolean, message: string} | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['llm-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/settings/llm');
      return res.data;
    },
  });

  const { register, handleSubmit, watch, formState: { errors, isDirty }, reset } = useForm<UpdateLlmSettingsDto>({
    resolver: zodResolver(updateLlmSettingsSchema),
    values: settings,
  });

  const temperatureValue = watch('temperature') ?? settings?.temperature ?? 0.7;
  const watchProvider = watch('provider') || settings?.provider || 'openai';
  const watchApiKey = watch('apiKey');

  const handleValidateKey = async () => {
    if (!watchApiKey) return;
    
    setIsValidating(true);
    setValidationResult(null);
    try {
      await apiClient.post('/settings/llm/validate', {
        provider: watchProvider,
        apiKey: watchApiKey
      });
      setValidationResult({ success: true, message: 'API Key is valid!' });
    } catch (error) {
      setValidationResult({ success: false, message: 'Invalid API Key. Please check and try again.' });
    } finally {
      setIsValidating(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: UpdateLlmSettingsDto) => {
      await apiClient.patch('/settings/llm', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-settings'] });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    },
  });

  const onSubmit = (data: UpdateLlmSettingsDto) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">LLM Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Configure the AI brains behind your brand content.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
              <Cpu className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Model Configuration</h2>
              <p className="text-sm text-gray-500">Select your preferred provider and model.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <select
                {...register('provider')}
                className="w-full h-10 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              >
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="google">Google (Gemini)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <Input
                {...register('model')}
                placeholder="e.g. gpt-4o"
                error={errors.model?.message}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Temperature ({temperatureValue})</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                {...register('temperature', { valueAsNumber: true })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Predictable</span>
                <span>Creative</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Tokens</label>
              <Input
                type="number"
                {...register('maxTokens', { valueAsNumber: true })}
                error={errors.maxTokens?.message}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <Key className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Custom API Key</h2>
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-600 border-amber-600/20 bg-amber-600/5">Optional</Badge>
              </div>
              <p className="text-sm text-gray-500">Use your own billing instead of platform credits.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                If provided, we will use your API key for all generation requests for this business. 
                Your key is <strong>encrypted at rest</strong> and never shared.
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">API Key</label>
                {settings?.hasApiKey && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <ShieldCheck className="w-3 h-3" /> Key Configured
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="password"
                    {...register('apiKey')}
                    placeholder={settings?.hasApiKey ? 'Enter new key to replace existing' : 'sk-....'}
                    error={errors.apiKey?.message}
                  />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleValidateKey}
                  disabled={isValidating || !watchApiKey}
                  className="shrink-0"
                >
                  {isValidating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-600 mr-2"></div>
                  ) : null}
                  {isValidating ? 'Validating...' : 'Validate Key'}
                </Button>
              </div>
              {validationResult && (
                <div className={`text-sm mt-2 flex items-center gap-1 ${validationResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {validationResult.success ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {validationResult.message}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFallbackEnabled"
                {...register('isFallbackEnabled')}
                className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
              />
              <label htmlFor="isFallbackEnabled" className="text-sm text-gray-600 dark:text-gray-400">
                Allow fallback to platform keys if my key fails
              </label>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
             {isSuccess && (
               <div className="flex items-center gap-1 text-sm text-green-600 animate-in fade-in slide-in-from-left-2">
                 <Sparkles className="w-4 h-4" />
                 Settings saved successfully!
               </div>
             )}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={!isDirty || mutation.isPending}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || mutation.isPending}
              className="gap-2"
            >
              {mutation.isPending ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
