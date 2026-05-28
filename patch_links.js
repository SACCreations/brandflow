const fs = require('fs');
let file = fs.readFileSync('apps/web/src/components/brand/brand-form.tsx', 'utf8');

file = file.replace(
  /(<Input\s+placeholder="https:\/\/behance\.net\/\.\.\."\s+value=\{link\}[^>]*\/>)/g,
  `$1\n                  {errors?.designPreferences?.referenceLinks?.[idx]?.message && <p className="text-[10px] text-red-500 font-bold absolute -bottom-5 left-2">{errors.designPreferences.referenceLinks[idx].message as string}</p>}`
);

fs.writeFileSync('apps/web/src/components/brand/brand-form.tsx', file);
console.log('Done');
