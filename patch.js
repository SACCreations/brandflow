const fs = require('fs');
let file = fs.readFileSync('apps/web/src/components/brand/brand-form.tsx', 'utf8');

// Function to add error indicator string to Input/Textarea
function addError(content, fieldPath, nestedErrorStr) {
  // Find the `<Input {...register('fieldPath')}` or similar
  const regex = new RegExp(`(<(?:Input|Textarea)[^>]*\\{\\.\\.\\.register\\('${fieldPath}'[^}]*\\)\\}[^>]*className=)(["'])([^"']*)(["'])([^>]*>)`, 'g');
  
  content = content.replace(regex, (match, p1, p2, p3, p4, p5) => {
    // If it already has cn(), we need to insert the error class conditionally
    if (match.includes('cn(')) {
       // It's tricky to regex replace inside cn() safely without AST if it's already there. 
       // Most inputs don't have cn() in brand-form.tsx, they just have className="..." 
    }
    // We will just do a simpler replacement in a custom way.
    return match;
  });
  return content;
}

// Actually, let's just do simple replacements for known lines.
let replacements = [
  {
    search: `label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Primary Logo Variant</label>`,
    replace: `label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">Primary Logo Variant <span className="text-red-500">*</span></label>`
  },
  {
    search: `label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Competitor Name</label>`,
    replace: `label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">Competitor Name <span className="text-red-500">*</span></label>`
  },
];

for (let r of replacements) {
  file = file.replace(r.search, r.replace);
}

// For inputs, we can append the error message right after the closing tag of Input/Textarea
const inputsToPatch = [
  { path: 'positioning', err: 'errors?.positioning?.message' },
  { path: 'identity.mission', err: 'errors?.identity?.mission?.message' },
  { path: 'audience.primaryAudience', err: 'errors?.audience?.primaryAudience?.message' },
  { path: 'strategy.targetLocation', err: 'errors?.strategy?.targetLocation?.message' },
  { path: 'strategy.ageGroup', err: 'errors?.strategy?.ageGroup?.message' },
  { path: 'strategy.interests', err: 'errors?.strategy?.interests?.message' },
  { path: 'differentiators', err: 'errors?.differentiators?.message' },
  { path: 'governance.requiredDisclaimer', err: 'errors?.governance?.requiredDisclaimer?.message' },
  { path: 'approvalWorkflow.reviewerName', err: 'errors?.approvalWorkflow?.reviewerName?.message' },
  { path: 'approvalWorkflow.finalApproverName', err: 'errors?.approvalWorkflow?.finalApproverName?.message' },
  { path: 'approvalWorkflow.approvalTiming', err: 'errors?.approvalWorkflow?.approvalTiming?.message' },
  { path: 'approvalWorkflow.revisionLimit', err: 'errors?.approvalWorkflow?.revisionLimit?.message' },
  { path: 'campaignDetails.monthlyBudget', err: 'errors?.campaignDetails?.monthlyBudget?.message' },
  { path: 'campaignDetails.duration', err: 'errors?.campaignDetails?.duration?.message' },
  { path: 'campaignDetails.targetLeads', err: 'errors?.campaignDetails?.targetLeads?.message' },
  { path: 'analyticsConfig.kpiExpectations', err: 'errors?.analyticsConfig?.kpiExpectations?.message' },
  { path: 'socialAccess.metaBusinessManagerId', err: 'errors?.socialAccess?.metaBusinessManagerId?.message' },
  { path: 'socialAccess.adAccountId', err: 'errors?.socialAccess?.adAccountId?.message' },
];

for (let input of inputsToPatch) {
  const regex = new RegExp(`(<(Input|Textarea)[^>]*\\{\\.\\.\\.register\\('${input.path}'[^}]*\\)\\}[^>]*>)(?!\\s*\\{${input.err.replace(/\\./g, '\\\\.')})`, 'g');
  file = file.replace(regex, `$1\n                {${input.err} && <p className="text-xs text-red-500 font-bold mt-2">{${input.err} as string}</p>}`);
}

// Special case for dynamic competitor fields
// errors?.competitors?.[idx]?.name?.message
file = file.replace(
  /(<Input\s+placeholder="Competitor Name"\s+className="h-12 text-sm bg-background\/60"[^>]*\/>)/g,
  `$1\n                      {errors?.competitors?.[idx]?.name?.message && <p className="text-xs text-red-500 font-bold mt-2">{errors.competitors[idx].name.message as string}</p>}`
);
file = file.replace(
  /(<Input\s+placeholder="https:\/\/..."\s+className="h-12 text-sm bg-background\/60"[^>]*\/>)/g,
  `$1\n                      {errors?.competitors?.[idx]?.website?.message && <p className="text-xs text-red-500 font-bold mt-2">{errors.competitors[idx].website.message as string}</p>}`
);
file = file.replace(
  /(<Textarea\s+placeholder="What do they do well\?"\s+className="h-24 text-sm bg-background\/60"[^>]*\/>)/g,
  `$1\n                      {errors?.competitors?.[idx]?.strengths?.message && <p className="text-xs text-red-500 font-bold mt-2">{errors.competitors[idx].strengths.message as string}</p>}`
);
file = file.replace(
  /(<Textarea\s+placeholder="Where are they vulnerable\?"\s+className="h-24 text-sm bg-background\/60"[^>]*\/>)/g,
  `$1\n                      {errors?.competitors?.[idx]?.weaknesses?.message && <p className="text-xs text-red-500 font-bold mt-2">{errors.competitors[idx].weaknesses.message as string}</p>}`
);

// Special case for social handles
// plat.handleField can be 'socialAccess.facebookPage' etc
// {errors?.socialAccess?.[plat.id]?.message} -- wait, handleField is string like "socialAccess.instagramHandle"
// This is inside a map over PLATFORMS
// <Input {...register(plat.handleField as any)} placeholder={plat.placeholder} ... />
file = file.replace(
  /(<Input \{\.\.\.register\(plat\.handleField as any\)\}[^>]*\/>)/g,
  `$1\n                      {(() => {\n                        const fieldName = plat.handleField.split('.')[1];\n                        const err = (errors?.socialAccess as any)?.[fieldName]?.message;\n                        return err ? <p className="text-xs text-red-500 font-bold mt-2">{err as string}</p> : null;\n                      })()}`
);

fs.writeFileSync('apps/web/src/components/brand/brand-form.tsx', file);
console.log('Done');
