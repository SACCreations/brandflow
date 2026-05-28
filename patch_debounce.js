const fs = require('fs');
let file = fs.readFileSync('apps/web/src/components/brand/brand-form.tsx', 'utf8');

file = file.replace(
  /React\.useEffect\(\(\) => \{\n\s+const stringified = JSON\.stringify\(values\);\n\s+if \(stringified !== lastValuesRef\.current\) \{\n\s+lastValuesRef\.current = stringified;\n\s+onDataChange\(values\);\n\s+\}\n\s+\}, \[values, onDataChange\]\);/g,
  `React.useEffect(() => {
    const stringified = JSON.stringify(values);
    if (stringified !== lastValuesRef.current) {
      lastValuesRef.current = stringified;
      const timeoutId = setTimeout(() => {
        onDataChange(values);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [values, onDataChange]);`
);

fs.writeFileSync('apps/web/src/components/brand/brand-form.tsx', file);
console.log('Done debounce patch');
