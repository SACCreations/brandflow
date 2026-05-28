const fs = require('fs');
let file = fs.readFileSync('apps/web/src/components/brand/brand-form.tsx', 'utf8');

file = file.replace(
  /const lastInitialDataStr = React\.useRef\(''\);\n\s+React\.useEffect\(\(\) => \{\n\s+const newDataStr = JSON\.stringify\(initialData\);\n\s+if \(newDataStr !== lastInitialDataStr\.current\) \{\n\s+lastInitialDataStr\.current = newDataStr;\n\s+reset\(sanitizeInitialData\(initialData\) \|\| defaultBrandFormValues\);\n\s+\}\n\s+\}, \[initialData, reset\]\);/g,
  `const lastInitialDataStr = React.useRef('');
  React.useEffect(() => {
    const newDataStr = JSON.stringify(initialData);
    const currentValuesStr = JSON.stringify(values);
    if (newDataStr !== lastInitialDataStr.current && newDataStr !== currentValuesStr) {
      lastInitialDataStr.current = newDataStr;
      reset(sanitizeInitialData(initialData) || defaultBrandFormValues);
    } else if (newDataStr !== lastInitialDataStr.current) {
      lastInitialDataStr.current = newDataStr;
    }
  }, [initialData, reset, values]);`
);

fs.writeFileSync('apps/web/src/components/brand/brand-form.tsx', file);
console.log('Done loop patch 2');
