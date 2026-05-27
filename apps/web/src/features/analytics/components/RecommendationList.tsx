import { Sparkles } from 'lucide-react';

interface RecommendationListProps {
  recommendations?: Array<{ topic: string; recommendation: string; confidence: number; impact: string }>;
  isRecLoading: boolean;
}

export function RecommendationList({ recommendations, isRecLoading }: RecommendationListProps) {
  return (
    <div className="lg:col-span-12">
      <div className="rounded-2xl border border-primary/10 dark:border-primary/20 bg-brand-50/50 dark:bg-primary/100/5 p-8 backdrop-blur-sm shadow-sm">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
          <Sparkles className="h-6 w-6 text-primary dark:text-brand-400" />
          Strategic Learning Loop
        </h3>
        <div className="grid gap-6 md:grid-cols-2">
          {isRecLoading ? (
            [1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface-2/50" />)
          ) : recommendations?.length ? (
            recommendations.map((rec, i) => (
              <RecommendationCard
                key={i}
                topic={rec.topic}
                recommendation={rec.recommendation}
                confidence={Math.round(rec.confidence * 100)}
                impact={rec.impact}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No strategic recommendations available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({
  topic,
  recommendation,
  confidence,
  impact,
}: {
  topic: string;
  recommendation: string;
  confidence: number;
  impact: string;
}) {
  return (
    <div className="group glass-panel p-6 hover:shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-lg bg-brand-50/80 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-700 dark:bg-primary/100/10 dark:text-brand-400 border border-primary/10 dark:border-primary/20">
          Recommendation
        </span>
        <span
          className={`rounded-md px-2 py-1 text-[10px] font-bold border ${
            impact === 'High' 
              ? 'bg-emerald-50/80 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
              : 'bg-blue-50/80 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
          }`}
        >
          {impact} Impact
        </span>
      </div>
      <h3 className="mb-2 text-lg font-bold text-foreground">{topic}</h3>
      <p className="mb-6 text-sm italic leading-relaxed text-muted-foreground">&ldquo;{recommendation}&rdquo;</p>
      <div className="flex items-center justify-between border-t border-border/60/50 pt-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full bg-primary shadow-sm" style={{ width: `${confidence}%` }} />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground">{confidence}% Confidence</span>
        </div>
      </div>
    </div>
  );
}
