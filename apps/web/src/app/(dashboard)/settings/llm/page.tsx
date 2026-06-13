'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateLlmSettingsSchema, type UpdateLlmSettingsDto, DEFAULT_NVIDIA_SYSTEM_PROMPTS } from '@brandflow/shared';
import { apiClient } from '@/lib/api-client';
import { Button, Card, Input, Badge } from '@brandflow/ui';
import {
  Cpu,
  Key,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Save,
  ChevronDown,
  ChevronUp,
  Zap,
  Image,
  MessageSquare,
  BarChart3,
  FileText,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────
interface NvidiaModel {
  id: string;
  label: string;
  description: string;
  tasks: readonly string[];
}

interface ProviderCardProps {
  id: string;
  name: string;
  logo: React.ReactNode;
  description: string;
  badge?: string;
  selected: boolean;
  onClick: () => void;
}

// ─── NVIDIA task definitions (mirrors the spec) ────────────────────
const NVIDIA_TASKS = [
  {
    key: 'contentCreation' as const,
    label: 'Content Creation',
    description: 'Blog articles, landing pages, email marketing, product descriptions',
    icon: FileText,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10 border-emerald-400/20',
    defaultModel: 'meta/llama-3.1-70b-instruct',
  },
  {
    key: 'imagePromptCreation' as const,
    label: 'Image Prompt Creation',
    description: 'Generate detailed prompts for image-generation models',
    icon: Image,
    color: 'text-violet-400',
    bg: 'bg-violet-400/10 border-violet-400/20',
    defaultModel: 'nvidia/nemotron-nano-8b-instruct',
  },
  {
    key: 'socialMediaCaptions' as const,
    label: 'Social Media Captions',
    description: 'Platform-specific captions for LinkedIn, Instagram, Facebook, X',
    icon: MessageSquare,
    color: 'text-sky-400',
    bg: 'bg-sky-400/10 border-sky-400/20',
    defaultModel: 'meta/llama-3.1-70b-instruct',
  },
  {
    key: 'campaignStrategy' as const,
    label: 'Campaign Strategy',
    description: 'Comprehensive marketing campaigns, personas, KPIs, budget allocation',
    icon: BarChart3,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/20',
    defaultModel: 'nvidia/llama-3.1-nemotron-70b-instruct',
  },
];

// Image generation is informational only (uses FLUX.1-dev, no user override)
const IMAGE_GENERATION_INFO = {
  label: 'Image Generation',
  description: 'Generate marketing creatives and branded visuals',
  model: 'FLUX.1-dev',
  icon: Zap,
  color: 'text-orange-400',
  bg: 'bg-orange-400/10 border-orange-400/20',
};

// ─── Provider Card Component ───────────────────────────────────────
function ProviderCard({ id, name, logo, description, badge, selected, onClick }: ProviderCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      id={`provider-card-${id}`}
      className={`relative w-full text-left p-4 rounded-2xl border transition-all duration-200 group ${
        selected
          ? 'border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)] shadow-primary/10'
          : 'border-border/50 bg-surface-2/50 hover:border-border hover:bg-surface-2'
      }`}
    >
      {selected && (
        <span className="absolute top-3 right-3">
          <CheckCircle2 className="w-4 h-4 text-primary" />
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl border transition-colors ${selected ? 'bg-primary/10 border-primary/20' : 'bg-surface-3 border-border/30'}`}>
          {logo}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{name}</span>
            {badge && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[hsl(var(--ai))]/10 text-[hsl(var(--ai))] border border-[hsl(var(--ai))]/20">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
    </button>
  );
}

// ─── NVIDIA Logo SVG ───────────────────────────────────────────────
function NvidiaLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.5 3.5v2.7c.7-.4 1.5-.7 2.3-.8V3.5H9.5zm2.3 0v2.4c.8.1 1.6.4 2.3.8V3.5H11.8zm-4.6 2.7c-.9.6-1.6 1.4-2.2 2.3h2.2V6.2zm9.2 0V8.5h2.2c-.6-.9-1.3-1.7-2.2-2.3zM5 8.5v7h14v-7H5zm2 1.5h2v4H7V10zm4 0h2v4h-2V10zm4 0h2v4h-2V10z"/>
    </svg>
  );
}

// ─── Main Page Component ───────────────────────────────────────────
export default function LlmSettingsPage() {
  const queryClient = useQueryClient();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showRoutingLogic, setShowRoutingLogic] = useState(false);

  // ── Fetch current settings ────────────────────────────────────
  const { data: settings, isLoading } = useQuery({
    queryKey: ['llm-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/settings/llm');
      return res.data;
    },
  });

  // ── Fetch NVIDIA model list ───────────────────────────────────
  const { data: nvidiaModelsData } = useQuery({
    queryKey: ['nvidia-models'],
    queryFn: async () => {
      const res = await apiClient.get('/settings/llm/nvidia-models');
      return res.data.models as NvidiaModel[];
    },
    staleTime: Infinity,
  });

  const nvidiaModels: NvidiaModel[] = nvidiaModelsData ?? [];

  // ── Form setup ────────────────────────────────────────────────
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});

  const togglePromptExpand = (key: string) => {
    setExpandedPrompts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResetPromptToDefault = (key: keyof typeof DEFAULT_NVIDIA_SYSTEM_PROMPTS) => {
    setValue(`nvidiaSystemPrompts.${key}`, DEFAULT_NVIDIA_SYSTEM_PROMPTS[key], { shouldDirty: true });
  };

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
    reset,
  } = useForm<UpdateLlmSettingsDto>({
    resolver: zodResolver(updateLlmSettingsSchema),
    // Use defaultValues + manual reset on load so refetches don't clobber
    // the form and isDirty doesn't incorrectly gate the save button.
    defaultValues: {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 2000,
      isFallbackEnabled: true,
      apiKey: undefined,
      fluxApiKey: undefined,
      nvidiaTaskModels: {
        contentCreation: 'meta/llama-3.1-70b-instruct',
        imagePromptCreation: 'nvidia/nemotron-nano-8b-instruct',
        socialMediaCaptions: 'meta/llama-3.1-70b-instruct',
        campaignStrategy: 'nvidia/llama-3.1-nemotron-70b-instruct',
      },
      nvidiaSystemPrompts: DEFAULT_NVIDIA_SYSTEM_PROMPTS,
    },
  });

  const temperatureValue = watch('temperature') ?? settings?.temperature ?? 0.7;
  const watchProvider = watch('provider') || settings?.provider || 'openai';
  const watchApiKey = watch('apiKey');
  const isNvidia = watchProvider === 'nvidia';

  // Sync server settings into the form once they load
  useEffect(() => {
    if (!settings) return;
    reset({
      provider: settings.provider ?? 'openai',
      model: settings.model ?? 'gpt-4o',
      temperature: settings.temperature ?? 0.7,
      maxTokens: settings.maxTokens ?? 2000,
      isFallbackEnabled: settings.isFallbackEnabled ?? true,
      apiKey: settings.apiKey ?? undefined,
      fluxApiKey: settings.fluxApiKey ?? undefined,
      nvidiaTaskModels: settings.nvidiaTaskModels ?? {
        contentCreation: 'meta/llama-3.1-70b-instruct',
        imagePromptCreation: 'nvidia/nemotron-nano-8b-instruct',
        socialMediaCaptions: 'meta/llama-3.1-70b-instruct',
        campaignStrategy: 'nvidia/llama-3.1-nemotron-70b-instruct',
      },
      nvidiaSystemPrompts: settings.nvidiaSystemPrompts ?? DEFAULT_NVIDIA_SYSTEM_PROMPTS,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // ── Validate API key ──────────────────────────────────────────
  const handleValidateKey = async () => {
    if (!watchApiKey) return;
    setIsValidating(true);
    setValidationResult(null);
    try {
      await apiClient.post('/settings/llm/validate', { provider: watchProvider, apiKey: watchApiKey });
      setValidationResult({ success: true, message: 'API Key is valid!' });
    } catch {
      setValidationResult({ success: false, message: 'Invalid API Key. Please check and try again.' });
    } finally {
      setIsValidating(false);
    }
  };

  // ── Save mutation ─────────────────────────────────────────────
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

  const [zodErrors, setZodErrors] = useState<string | null>(null);

  const onSubmit = (data: UpdateLlmSettingsDto) => {
    setZodErrors(null);
    mutation.mutate(data);
  };

  // Surface Zod validation errors if handleSubmit blocks submission
  const onInvalid = (errs: typeof errors) => {
    const first = Object.values(errs)[0];
    const msg = (first as any)?.message ?? 'Please fix the highlighted fields before saving.';
    setZodErrors(msg);
  };

  // ── Loading state ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading settings…</p>
        </div>
      </div>
    );
  }

  // ── Provider options ──────────────────────────────────────────
  const providers = [
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'GPT-4o, GPT-4 Turbo — industry standard for text generation',
      logo: <Sparkles className="w-4 h-4 text-emerald-500" />,
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      description: 'Claude 3 — excellent for long-form content and reasoning',
      logo: <Cpu className="w-4 h-4 text-orange-500" />,
    },
    {
      id: 'google',
      name: 'Google',
      description: 'Gemini Pro — multimodal intelligence from Google DeepMind',
      logo: <Zap className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 'nvidia',
      name: 'NVIDIA NIM',
      description: 'Multi-model routing across specialised NIM microservices',
      badge: 'RECOMMENDED',
      logo: <NvidiaLogo className="w-4 h-4 text-[#76b900]" />,
    },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">LLM Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure the AI models powering your marketing workflows.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">

        {/* ── Provider Selection ───────────────────────────────── */}
        <Card className="glass-premium p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[hsl(var(--ai))]/10 border border-[hsl(var(--ai))]/20 shadow-sm rounded-xl">
              <Cpu className="w-5 h-5 text-[hsl(var(--ai))]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">AI Provider</h2>
              <p className="text-sm text-muted-foreground">Choose the provider for all AI generation tasks.</p>
            </div>
          </div>

          <Controller
            control={control}
            name="provider"
            render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {providers.map((p) => (
                  <ProviderCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    logo={p.logo}
                    description={p.description}
                    badge={'badge' in p ? p.badge : undefined}
                    selected={field.value === p.id}
                    onClick={() => field.onChange(p.id)}
                  />
                ))}
              </div>
            )}
          />
        </Card>

        {/* ── NVIDIA Task Routing Panel ────────────────────────── */}
        {isNvidia && (
          <>
            <Card className="glass-premium p-6 border-[hsl(var(--ai))]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#76b900]/10 border border-[#76b900]/20 shadow-sm rounded-xl">
                <NvidiaLogo className="w-5 h-5 text-[#76b900]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Task → Model Routing</h2>
                <p className="text-sm text-muted-foreground">
                  Assign a specialised NVIDIA NIM model to each marketing task.
                </p>
              </div>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-2.5 p-3 mb-6 mt-4 rounded-xl bg-[hsl(var(--ai))]/5 border border-[hsl(var(--ai))]/15 text-sm">
              <Info className="w-4 h-4 text-[hsl(var(--ai))] mt-0.5 shrink-0" />
              <span className="text-muted-foreground">
                Requests are automatically routed to the assigned model based on the active task.
                Defaults follow the NVIDIA marketing assistant specification.
              </span>
            </div>

            <div className="space-y-3">
              {NVIDIA_TASKS.map((task) => {
                const Icon = task.icon;
                const fieldName = `nvidiaTaskModels.${task.key}` as const;

                // Filter models that support this task (show all as fallback)
                const compatibleModels = nvidiaModels.length > 0
                  ? nvidiaModels.filter((m) => m.tasks.includes(task.key) || m.tasks.length === 0)
                  : [];

                return (
                  <div
                    key={task.key}
                    id={`nvidia-task-${task.key}`}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-border/40 bg-surface-2/40 hover:bg-surface-2/70 transition-colors"
                  >
                    {/* Task label */}
                    <div className="flex items-center gap-3 sm:w-72 shrink-0">
                      <div className={`p-2 rounded-lg border ${task.bg}`}>
                        <Icon className={`w-4 h-4 ${task.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{task.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-4 h-4 text-border hidden sm:block shrink-0" />

                    {/* Model select */}
                    <div className="flex-1 min-w-0">
                      <Controller
                        control={control}
                        name={fieldName as any}
                        defaultValue={task.defaultModel}
                        render={({ field }) => (
                          <select
                            {...field}
                            value={field.value ?? task.defaultModel}
                            id={`model-select-${task.key}`}
                            className="w-full h-10 px-3 py-2 glass-panel border border-border/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm hover:border-border bg-surface-2"
                          >
                            {/* Always include defaults so value is never empty */}
                            <option value={task.defaultModel}>
                              {nvidiaModels.find((m) => m.id === task.defaultModel)?.label ?? task.defaultModel}
                              {' '}(Recommended)
                            </option>
                            {compatibleModels
                              .filter((m) => m.id !== task.defaultModel)
                              .map((m) => (
                                <option key={m.id} value={m.id}>{m.label}</option>
                              ))}
                            {/* All models as fallback */}
                            {nvidiaModels.length > 0 && (
                              <optgroup label="All models">
                                {nvidiaModels
                                  .filter((m) => !compatibleModels.some((c) => c.id === m.id) && m.id !== task.defaultModel)
                                  .map((m) => (
                                    <option key={m.id} value={m.id}>{m.label}</option>
                                  ))}
                              </optgroup>
                            )}
                          </select>
                        )}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Image Generation — informational (fixed FLUX.1-dev) */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-border/40 bg-surface-2/20 opacity-70">
                <div className="flex items-center gap-3 sm:w-72 shrink-0">
                  <div className={`p-2 rounded-lg border ${IMAGE_GENERATION_INFO.bg}`}>
                    <IMAGE_GENERATION_INFO.icon className={`w-4 h-4 ${IMAGE_GENERATION_INFO.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{IMAGE_GENERATION_INFO.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{IMAGE_GENERATION_INFO.description}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-border hidden sm:block shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 px-3 h-10 glass-panel border border-border/30 rounded-xl">
                    <span className="text-sm text-foreground font-mono">{IMAGE_GENERATION_INFO.model}</span>
                    <Badge variant="outline" className="ml-auto text-[10px] uppercase font-bold text-orange-400 border-orange-400/20 bg-orange-400/5">
                      Fixed
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Routing Logic accordion */}
            <button
              type="button"
              id="routing-logic-toggle"
              onClick={() => setShowRoutingLogic((v) => !v)}
              className="mt-5 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              {showRoutingLogic ? (
                <ChevronUp className="w-4 h-4 group-hover:text-primary" />
              ) : (
                <ChevronDown className="w-4 h-4 group-hover:text-primary" />
              )}
              View routing logic
            </button>

            {showRoutingLogic && (
              <div className="mt-3 p-4 rounded-xl bg-surface-3/50 border border-border/30 font-mono text-xs text-muted-foreground space-y-1.5 animate-in fade-in slide-in-from-top-2">
                <p className="text-foreground font-semibold font-sans text-xs mb-2">Routing Rules</p>
                {NVIDIA_TASKS.map((t) => (
                  <p key={t.key}>
                    <span className="text-[hsl(var(--ai))]">IF</span> task = <span className="text-foreground">{t.label}</span>{' '}
                    <span className="text-[hsl(var(--ai))]">→</span>{' '}
                    <span className="text-emerald-400">{`[selected model]`}</span>
                  </p>
                ))}
                <p>
                  <span className="text-[hsl(var(--ai))]">IF</span> task = <span className="text-foreground">Image Generation</span>{' '}
                  <span className="text-[hsl(var(--ai))]">→</span>{' '}
                  <span className="text-orange-400">FLUX.1-dev</span>
                </p>
              </div>
            )}
          </Card>

          {/* ── NVIDIA System Prompts ────────────────────────────── */}
          <Card className="glass-premium p-6 border-[hsl(var(--ai))]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#76b900]/10 border border-[#76b900]/20 shadow-sm rounded-xl">
                <FileText className="w-5 h-5 text-[#76b900]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Custom System Prompts</h2>
                <p className="text-sm text-muted-foreground">
                  Customize the system prompts used by the marketing assistant for each task type.
                </p>
              </div>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-2.5 p-3 mb-6 mt-4 rounded-xl bg-[hsl(var(--ai))]/5 border border-[hsl(var(--ai))]/15 text-sm">
              <Info className="w-4 h-4 text-[hsl(var(--ai))] mt-0.5 shrink-0" />
              <span className="text-muted-foreground">
                You can use placeholders like <code className="text-foreground font-mono text-xs">{"{{brand_name}}"}</code>, <code className="text-foreground font-mono text-xs">{"{{positioning}}"}</code>, <code className="text-foreground font-mono text-xs">{"{{audience}}"}</code>, and <code className="text-foreground font-mono text-xs">{"{{CONTENT}}"}</code> to inject context dynamically.
              </span>
            </div>

            <div className="space-y-4">
              {[
                {
                  key: 'contentCreation' as const,
                  label: 'Content Creation Prompt',
                  description: 'Used for blogs, articles, emails, landing pages, descriptions, and proposals',
                },
                {
                  key: 'imagePromptCreation' as const,
                  label: 'Image Prompt Creation Prompt',
                  description: 'Used for creating detailed image generation prompts from content strategy',
                },
                {
                  key: 'imageGeneration' as const,
                  label: 'Image Generation Prompt (FLUX.1-dev)',
                  description: 'Used for direct creative and brand visual prompt engineering',
                },
                {
                  key: 'socialMediaCaptions' as const,
                  label: 'Social Media Captions Prompt',
                  description: 'Used for platform-specific captions (LinkedIn, Instagram, X, etc.)',
                },
                {
                  key: 'campaignStrategy' as const,
                  label: 'Campaign Strategy Prompt',
                  description: 'Used for target audience personas, campaign planning, and strategy documents',
                },
              ].map((item) => {
                const isExpanded = !!expandedPrompts[item.key];
                const registerKey = `nvidiaSystemPrompts.${item.key}` as const;

                return (
                  <div
                    key={item.key}
                    className="border border-border/40 rounded-xl overflow-hidden bg-surface-2/20 hover:border-border/60 transition-colors"
                  >
                    {/* Header bar */}
                    <button
                      type="button"
                      onClick={() => togglePromptExpand(item.key)}
                      className="w-full flex items-center justify-between p-4 text-left outline-none hover:bg-surface-2/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            item.key === 'contentCreation' ? 'bg-emerald-400' :
                            item.key === 'imagePromptCreation' ? 'bg-violet-400' :
                            item.key === 'imageGeneration' ? 'bg-orange-400' :
                            item.key === 'socialMediaCaptions' ? 'bg-sky-400' : 'bg-amber-400'
                          }`} />
                          <h3 className="text-sm font-semibold text-foreground">{item.label}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Collapsible Area */}
                    {isExpanded && (
                      <div className="p-4 border-t border-border/30 bg-surface-2/10 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                        <textarea
                          {...register(registerKey)}
                          rows={12}
                          className="w-full p-3 font-mono text-xs leading-relaxed glass-panel border border-border/40 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-surface-3/50 text-foreground resize-y min-h-[200px]"
                          placeholder="Enter prompt template..."
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleResetPromptToDefault(item.key)}
                          >
                            Reset to Default
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
          </>
        )}

        {/* ── Model Configuration (non-NVIDIA) ─────────────────── */}
        {!isNvidia && (
          <Card className="glass-premium p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-surface-3 border border-border/30 rounded-xl">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Model Configuration</h2>
                <p className="text-sm text-muted-foreground">Select the default model and generation parameters.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Model</label>
                <Input
                  {...register('model')}
                  placeholder="e.g. gpt-4o"
                  error={errors.model?.message}
                />
                <p className="text-xs text-muted-foreground">
                  {watchProvider === 'openai' && 'e.g. gpt-4o, gpt-4-turbo, gpt-3.5-turbo'}
                  {watchProvider === 'anthropic' && 'e.g. claude-3-5-sonnet-20241022'}
                  {watchProvider === 'google' && 'e.g. gemini-1.5-pro-latest'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Max Tokens</label>
                <Input
                  type="number"
                  {...register('maxTokens', { valueAsNumber: true })}
                  error={errors.maxTokens?.message}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">
                  Temperature <span className="text-muted-foreground font-normal">({temperatureValue})</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  {...register('temperature', { valueAsNumber: true })}
                  className="w-full h-2 bg-surface-3 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 — Predictable</span>
                  <span>1 — Balanced</span>
                  <span>2 — Creative</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ── API Key ──────────────────────────────────────────── */}
        <Card className="glass-premium p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 shadow-sm rounded-xl">
              <Key className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">API Key</h2>
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-500 border-amber-500/20 bg-amber-500/5">
                  Optional
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {isNvidia
                  ? 'Your NVIDIA API key from build.nvidia.com'
                  : 'Use your own billing instead of platform credits.'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 glass-panel border border-border/50 rounded-xl shadow-sm">
              <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-sm text-foreground">
                If provided, we will use your API key for all generation requests for this business.
                Your key is <strong className="text-foreground">encrypted at rest</strong> and never shared.
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">
                  {isNvidia ? 'NVIDIA API Key' : 'API Key'}
                </label>
                {settings?.hasApiKey && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <ShieldCheck className="w-3 h-3" /> Key Configured
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="api-key-input"
                    type="password"
                    {...register('apiKey')}
                    placeholder={
                      settings?.hasApiKey
                        ? 'Enter new key to replace existing'
                        : isNvidia
                        ? 'nvapi-...'
                        : 'sk-....'
                    }
                    error={errors.apiKey?.message}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  id="validate-api-key-btn"
                  onClick={handleValidateKey}
                  disabled={isValidating || !watchApiKey}
                  className="shrink-0"
                >
                  {isValidating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-600 mr-2" />
                  ) : null}
                  {isValidating ? 'Validating…' : 'Validate Key'}
                </Button>
              </div>
              {validationResult && (
                <div
                  className={`text-sm mt-2 flex items-center gap-1 ${
                    validationResult.success ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {validationResult.success ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {validationResult.message}
                </div>
              )}
            </div>

            {/* ── FLUX API Key ─────────────────────────────────────── */}
            <div className="space-y-2 mt-6 pt-6 border-t border-border/50">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-400" />
                  FLUX.1-dev API Key (Black Forest Labs)
                </label>
                {settings?.fluxApiKey && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <ShieldCheck className="w-3 h-3" /> Key Configured
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Required for generating high-quality marketing creatives with the FLUX.1-dev model. Get your key from <a href="https://api.bfl.ml/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">api.bfl.ml</a>.
              </p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="flux-api-key-input"
                    type="password"
                    {...register('fluxApiKey')}
                    placeholder={
                      settings?.fluxApiKey
                        ? 'Enter new key to replace existing'
                        : 'Enter your BFL API key...'
                    }
                    error={errors.fluxApiKey?.message}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFallbackEnabled"
                {...register('isFallbackEnabled')}
                className="w-4 h-4 text-primary border-border rounded focus:ring-primary/20"
              />
              <label htmlFor="isFallbackEnabled" className="text-sm text-muted-foreground">
                Allow fallback to platform keys if my key fails
              </label>
            </div>
          </div>
        </Card>

        {/* ── Save Bar ──────────────────────────────────────────── */}
        <div className="space-y-3 pt-2">
          {/* Validation / mutation error banners */}
          {(zodErrors || mutation.isError) && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 text-sm text-red-500 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {zodErrors ?? 'Failed to save. Please try again.'}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSuccess && (
                <div className="flex items-center gap-1.5 text-sm text-emerald-600 animate-in fade-in slide-in-from-left-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Settings saved successfully!
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                id="reset-settings-btn"
                onClick={() => settings && reset(settings)}
                disabled={mutation.isPending}
              >
                Reset
              </Button>
              <Button
                type="submit"
                id="save-settings-btn"
                disabled={mutation.isPending}
                className="gap-2"
              >
                {mutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {mutation.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
