'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Palette, 
  MessageSquare, 
  ShieldCheck, 
  Globe, 
  Users, 
  Layout, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  X,
  Loader2
} from 'lucide-react';
import { cn, Button, Progress, useToast } from '@brandflow/ui';
import { BrandForm } from './brand-form';
import { LivePreview } from './live-preview';
import { useDraft } from '@/hooks/use-draft';

interface BrandWizardProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  title: string;
  onClose?: () => void;
  initialData?: any;
  isEditMode?: boolean;
}

const STEPS = [
  { id: 'basics', label: 'Core Basics', icon: Building2, description: 'Name, Industry, Description' },
  { id: 'visuals', label: 'Identity', icon: Palette, description: 'Logos & Visual Style' },
  { id: 'voice', label: 'Voice & Intelligence', icon: MessageSquare, description: 'Tone & Knowledge' },
  { id: 'strategy', label: 'Market Strategy', icon: Users, description: 'Audience & Competitors' },
  { id: 'design-prefs', label: 'Design Direction', icon: Layout, description: 'Visual Styles & Animation' },
  { id: 'rules', label: 'Governance', icon: ShieldCheck, description: 'Workflow & Compliance' },
  { id: 'social', label: 'Social & Campaigns', icon: Globe, description: 'Accounts & Goals' },
  { id: 'finish', label: 'Analytics & Finish', icon: Sparkles, description: 'Reporting & Review' }
];

export function BrandWizard({ onSubmit, isLoading, title, onClose, initialData, isEditMode }: BrandWizardProps) {
  const [currentStepIdx, setCurrentStepIdx] = React.useState(0);
  const [maxVisitedStepIdx, setMaxVisitedStepIdx] = React.useState(0);
  const [formData, setFormData] = React.useState<any>(initialData || {});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const { saveDraft, clearDraft } = useDraft<any>('brand_wizard');
  
  const triggerValidationRef = React.useRef<(() => Promise<boolean>) | undefined>(undefined);

  // Warn on unsaved changes
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formData && Object.keys(formData).length > 0) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData]);

  const currentStep = (STEPS[currentStepIdx] || STEPS[0]) as typeof STEPS[number];
  const progress = ((currentStepIdx + 1) / STEPS.length) * 100;

  React.useEffect(() => {
    setMaxVisitedStepIdx(prev => Math.max(prev, currentStepIdx));
  }, [currentStepIdx]);

  React.useEffect(() => {
    setFormData(initialData || {});
  }, [initialData]);

  const handleNext = async () => {
    if (triggerValidationRef.current) {
      const isValid = await triggerValidationRef.current();
      if (!isValid) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Please complete all required fields correctly before moving to the next step.',
        });
        return;
      }
    }

    if (currentStepIdx < STEPS.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      try {
        setIsSubmitting(true);
        await onSubmit(formData);
        clearDraft();
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: isEditMode ? 'Failed to update brand' : 'Failed to create brand',
          description: err?.message || 'An unexpected error occurred. Please try again.',
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  const handleStepClick = async (idx: number) => {
    if (idx === currentStepIdx) return;

    if (idx < currentStepIdx) {
      // Going backward is always allowed
      setCurrentStepIdx(idx);
      return;
    }

    // Moving forward: enforce step-by-step completion
    if (idx === currentStepIdx + 1) {
      if (triggerValidationRef.current) {
        const isValid = await triggerValidationRef.current();
        if (!isValid) {
          toast({
            variant: 'destructive',
            title: 'Validation Error',
            description: 'Please complete all required fields correctly before proceeding.',
          });
          return;
        }
      }
      setCurrentStepIdx(idx);
    } else {
      toast({
        variant: 'destructive',
        title: 'Step Locked',
        description: 'Please proceed step-by-step using the Continue button.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50/50 dark:bg-gray-950/50 backdrop-blur-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-20 border-b border-white/20 dark:border-white/5 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl sticky top-0 z-50 px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20"
          >
            <Sparkles className="w-6 h-6" />
          </motion.div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">{title}</h1>
            <p className="text-[10px] font-bold text-gray-400">Step {currentStepIdx + 1} of {STEPS.length}: {currentStep.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 w-full max-w-md mx-8">
          <div className="flex-1 space-y-1.5">
             <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter text-gray-400">
                <span>Onboarding Progress</span>
                <span>{Math.round(progress)}%</span>
             </div>
             <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Wizard progress">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "circOut" }}
                  className="h-full bg-brand-600"
                />
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-xl font-bold text-[10px] uppercase tracking-widest text-gray-500"
              onClick={onClose}
            >
              Cancel
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl font-bold text-[10px] uppercase tracking-widest"
            onClick={() => {
              saveDraft(formData);
              toast({ title: 'Draft Saved', description: 'Your progress has been saved locally.' });
              if (onClose) onClose();
            }}
          >
            Save & Exit
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Sidebar Nav */}
        <aside className="w-72 flex-shrink-0 rounded-3xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md p-6 hidden lg:block overflow-y-auto custom-scrollbar shadow-xl">
          <nav aria-label="Wizard steps" role="tablist" aria-orientation="vertical" className="space-y-2">
            {STEPS.map((step, idx) => {
              const isActive = currentStepIdx === idx;
              const isVisited = idx <= maxVisitedStepIdx;
              return (
                <button
                  key={step.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`step-panel-${step.id}`}
                  id={`step-tab-${step.id}`}
                  aria-disabled={!isVisited}
                  onClick={() => handleStepClick(idx)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group relative",
                    isActive 
                      ? "bg-white/60 dark:bg-gray-800/60 shadow-lg border border-white/40 dark:border-white/10" 
                      : "hover:bg-white/40 dark:hover:bg-gray-800/40 border border-transparent",
                    !isVisited && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="active-step-indicator"
                      className="absolute -left-px top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-600 rounded-r-full"
                    />
                  )}
                  <div className={cn(
                    "w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-all",
                    isActive 
                      ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30" 
                      : isVisited 
                        ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-500/20" 
                        : "bg-white/50 dark:bg-gray-800/50 text-gray-400 group-hover:text-gray-900 dark:text-white dark:group-hover:text-white backdrop-blur-sm"
                  )}>
                    {isVisited && !isActive ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 py-0.5 min-w-0">
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest leading-none mb-1",
                      isActive ? "text-brand-600 dark:text-brand-400" : "text-gray-400"
                    )}>Step {idx + 1}</p>
                    <p className={cn(
                      "text-xs font-bold truncate",
                      isActive ? "text-gray-900 dark:text-white" : "text-gray-500"
                    )}>{step.label}</p>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Form Area */}
        <main className="flex-1 min-w-0 overflow-y-auto rounded-3xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md px-6 sm:px-12 py-8 sm:py-12 custom-scrollbar relative shadow-xl"
          role="tabpanel"
          id={`step-panel-${currentStep.id}`}
          aria-labelledby={`step-tab-${currentStep.id}`}
        >
           {/* Mobile Step Indicator */}
           <div className="flex items-center gap-2 mb-6 lg:hidden">
             {STEPS.map((_, idx) => (
               <div
                 key={idx}
                 className={cn(
                   "h-1.5 flex-1 rounded-full transition-colors",
                   idx <= currentStepIdx ? "bg-brand-600" : "bg-gray-200 dark:bg-gray-800"
                 )}
               />
             ))}
           </div>
           <div className="max-w-3xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                   <BrandForm 
                      initialData={formData}
                      onDataChange={(data) => setFormData(data)}
                      onSubmit={onSubmit}
                      isLoading={isLoading}
                      wizardMode
                      activeStepId={currentStep.id}
                      triggerValidationRef={triggerValidationRef}
                   />
                </motion.div>
              </AnimatePresence>

              {/* Navigation Actions */}
              <div className="mt-12 pt-6 border-t border-white/20 dark:border-white/5 flex items-center justify-between sticky bottom-0 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl pb-6 z-10 -mx-6 px-6 sm:-mx-12 sm:px-12">
                 <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStepIdx === 0}
                    className="rounded-xl font-bold h-12 px-6 sm:px-8 text-gray-500 hover:text-gray-900 dark:text-white dark:hover:text-white transition-colors"
                 >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                 </Button>

                 <Button
                    onClick={handleNext}
                    disabled={isLoading || isSubmitting}
                    className="rounded-xl font-black h-12 px-8 sm:px-12 bg-brand-600 hover:bg-brand-700 text-white shadow-xl shadow-brand-500/20 uppercase tracking-tight transition-all"
                 >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {isEditMode ? 'Saving...' : 'Creating...'}</>
                    ) : currentStepIdx === STEPS.length - 1 ? (
                      <>{isEditMode ? 'Save Changes' : 'Finish & Publish'} <CheckCircle2 className="w-4 h-4 ml-2" /></>
                    ) : (
                      <>Continue <ChevronRight className="w-4 h-4 ml-2" /></>
                    )}
                 </Button>
              </div>
           </div>
        </main>

        {/* Preview Panel */}
        <aside className="w-[450px] flex-shrink-0 hidden xl:block rounded-3xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md overflow-hidden shadow-xl">
           <LivePreview data={formData} />
        </aside>
      </div>
    </div>
  );
}
