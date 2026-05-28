const fs = require('fs');
let file = fs.readFileSync('apps/web/src/components/brand/brand-form.tsx', 'utf8');

const selectPatches = [
  { match: /onValueChange=\{\(val\) => setValue\('strategy\.postingFrequency', val, \{ shouldDirty: true \}\)\}/g, err: 'errors?.strategy?.postingFrequency?.message' },
  { match: /onValueChange=\{\(val\) => setValue\('strategy\.contentLanguage', val, \{ shouldDirty: true \}\)\}/g, err: 'errors?.strategy?.contentLanguage?.message' },
  { match: /onValueChange=\{\(val\) => setValue\('designPreferences\.preferredStyle', val, \{ shouldDirty: true \}\)\}/g, err: 'errors?.designPreferences?.preferredStyle?.message' },
  { match: /onValueChange=\{\(val\) => setValue\('designPreferences\.imageStyle', val, \{ shouldDirty: true \}\)\}/g, err: 'errors?.designPreferences?.imageStyle?.message' },
  { match: /onValueChange=\{\(val\) => setValue\('campaignDetails\.marketingGoal', val, \{ shouldDirty: true \}\)\}/g, err: 'errors?.campaignDetails?.marketingGoal?.message' }
];

for (let patch of selectPatches) {
  const regex = new RegExp(`(<Select[^>]*${patch.match.source}[^>]*>[\\s\\S]*?<\\/Select>)`, 'g');
  file = file.replace(regex, `$1\n                  {${patch.err} && <p className="text-xs text-red-500 font-bold mt-2">{${patch.err} as string}</p>}`);
}

fs.writeFileSync('apps/web/src/components/brand/brand-form.tsx', file);
console.log('Done select patch');
