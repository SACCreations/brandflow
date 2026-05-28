const fs = require('fs');
let file = fs.readFileSync('apps/web/src/components/brand/brand-form.tsx', 'utf8');

file = file.replace(
  /const lastInitialDataStr = React\.useRef\(''\);\n\s+React\.useEffect\(\(\) => \{\n\s+const newDataStr = JSON\.stringify\(initialData\);\n\s+const currentValuesStr = JSON\.stringify\(values\);\n\s+if \(newDataStr !== lastInitialDataStr\.current && newDataStr !== currentValuesStr\) \{\n\s+lastInitialDataStr\.current = newDataStr;\n\s+reset\(sanitizeInitialData\(initialData\) \|\| defaultBrandFormValues\);\n\s+\} else if \(newDataStr !== lastInitialDataStr\.current\) \{\n\s+lastInitialDataStr\.current = newDataStr;\n\s+\}\n\s+\}, \[initialData, reset, values\]\);/g,
  `const hasInitialized = React.useRef(false);
  React.useEffect(() => {
    if (!hasInitialized.current) {
      reset(sanitizeInitialData(initialData) || defaultBrandFormValues);
      hasInitialized.current = true;
    }
  }, [initialData, reset]);`
);

fs.writeFileSync('apps/web/src/components/brand/brand-form.tsx', file);
console.log('Done loop patch 3');
