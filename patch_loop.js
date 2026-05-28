const fs = require('fs');
let file = fs.readFileSync('apps/web/src/components/brand/brand-form.tsx', 'utf8');

file = file.replace(
  /React\.useEffect\(\(\) => \{\n\s+reset\(sanitizeInitialData\(initialData\) \|\| defaultBrandFormValues\);\n\s+\}, \[initialData, reset\]\);/g,
  `const lastInitialDataStr = React.useRef('');
  React.useEffect(() => {
    const newDataStr = JSON.stringify(initialData);
    if (newDataStr !== lastInitialDataStr.current) {
      lastInitialDataStr.current = newDataStr;
      reset(sanitizeInitialData(initialData) || defaultBrandFormValues);
    }
  }, [initialData, reset]);`
);

fs.writeFileSync('apps/web/src/components/brand/brand-form.tsx', file);
console.log('Done loop patch');
