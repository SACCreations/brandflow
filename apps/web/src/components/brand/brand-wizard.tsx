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
  X
} from 'lucide-react';
import { cn, Button, Progress, useToast } from '@brandflow/ui';
import { BrandForm } from './brand-form';
import { LivePreview } from './live-preview';

interface BrandWizardProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  title: string;
  onClose?: () => void;
  initialData?: any;
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

export function BrandWizard({ onSubmit, isLoading, title, onClose, initialData }: BrandWizardProps) {
  const [currentStepIdx, setCurrentStepIdx] = React.useState(0);
  const [maxVisitedStepIdx, setMaxVisitedStepIdx] = React.useState(0);
  const [formData, setFormData] = React.useState<any>(initialData || {});
  const { toast } = useToast();
  
  const triggerValidationRef = React.useRef<(() => Promise<boolean>) | undefined>(undefined);

  const currentStep = (STEPS[currentStepIdx] || STEPS[0]) as typeof STEPS[number];
  const progress = ((currentStepIdx + 1) / STEPS.length) * 100;

  React.useEffect(() => {
    setMaxVisitedStepIdx(prev => Math.max(prev, currentStepIdx));
  }, [currentStepIdx]);

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
      await onSubmit(formData);
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
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-20 border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl sticky top-0 z-50 px-8 flex items-center justify-between">
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
             <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
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
              toast({ title: 'Draft Saved', description: 'Your progress has been saved locally.' });
              if (onClose) onClose();
            }}
          >
            Save & Exit
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-80 flex-shrink-0 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 hidden lg:block overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {STEPS.map((step, idx) => {
              const isActive = currentStepIdx === idx;
              const isVisited = idx <= maxVisitedStepIdx;
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(idx)}
                  className={cn(
                    "w-full flex items-start gap-4 p-4 rounded-2xl transition-all text-left group relative",
                    isActive 
                      ? "bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent",
                    !isVisited && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="active-step-indicator"
                      className="absolute left-0 top-4 w-1 h-8 bg-brand-600 rounded-r-full"
                    />
                  )}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    isActive 
                      ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20" 
                      : isVisited 
                        ? "bg-emerald-500 text-white" 
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                  )}>
                    {isVisited && !isActive ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 py-0.5">
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest leading-none mb-1",
                      isActive ? "text-brand-600" : "text-gray-400"
                    )}>Step {idx + 1}</p>
                    <p className={cn(
                      "text-xs font-bold truncate",
                      isActive ? "text-gray-900 dark:text-white" : "text-gray-500"
                    )}>{step.label}</p>
                    <p className="text-[9px] text-gray-400 font-medium truncate mt-0.5">{step.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Form Area */}
        <main className="flex-1 min-w-[500px] overflow-y-auto bg-white dark:bg-gray-950 px-12 py-16 custom-scrollbar relative">
           <div className="max-w-2xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
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
              <div className="mt-12 pt-12 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                 <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStepIdx === 0}
                    className="rounded-xl font-bold h-12 px-8 text-gray-500"
                 >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                 </Button>

                 <Button
                    onClick={handleNext}
                    disabled={isLoading}
                    className="rounded-xl font-black h-12 px-12 bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-500/20 uppercase tracking-tight"
                 >
                    {currentStepIdx === STEPS.length - 1 ? (
                      <>Finish & Publish <CheckCircle2 className="w-4 h-4 ml-2" /></>
                    ) : (
                      <>Continue <ChevronRight className="w-4 h-4 ml-2" /></>
                    )}
                 </Button>
              </div>
           </div>
        </main>

        {/* Preview Panel */}
        <aside className="w-[400px] flex-shrink-0 hidden xl:block border-l border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30">
           <LivePreview data={formData} />
        </aside>
      </div>
    </div>
  );
}
