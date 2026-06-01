import { createBrandSchema } from "./packages/shared/src/validators/index";

const mockFormValues = {
  name: 'Test Brand',
  slug: 'test-brand',
  industry: 'Software',
  status: 'published',
  tone: [],
  visualRules: {
    logoUrls: [
      { url: 'https://example.com/logo.png', type: 'primary', name: 'Primary Logo' },
      { url: '', type: 'dark', name: 'Dark Variant' }
    ],
    colorTokens: [
      { id: '1', name: 'Primary Indigo', value: '#6366f1', type: 'primary' },
      { id: '2', name: 'Secondary Slate', value: '#475569', type: 'secondary' },
      { id: '3', name: 'Accent Pink', value: '#f43f5e', type: 'accent' },
      { id: '4', name: 'Neutral Gray', value: '#f1f5f9', type: 'neutral' },
      { id: '5', name: 'Semantic Red', value: '#ef4444', type: 'semantic' }
    ],
    typographySettings: [
      { id: 'h', label: 'Heading Font', fontFamily: 'Inter', weight: '700', sizeScale: '1.5', lineHeight: '1.2' },
      { id: 'b', label: 'Body Font', fontFamily: 'Inter', weight: '400', sizeScale: '1', lineHeight: '1.5' },
      { id: 's', label: 'Supporting Font', fontFamily: 'Inter', weight: '400', sizeScale: '0.875', lineHeight: '1.4' },
      { id: 'bs', label: 'Backup/System Font', fontFamily: 'sans-serif', weight: '400', sizeScale: '1', lineHeight: '1.5' }
    ],
    typographyScales: [
      { id: 'h1', label: 'Heading 1', size: '32px', spacing: '-0.02em' },
      { id: 'h2', label: 'Heading 2', size: '24px', spacing: '-0.01em' },
      { id: 'h3', label: 'Heading 3', size: '20px', spacing: '0' },
      { id: 'body', label: 'Body', size: '16px', spacing: '0' }
    ],
  },
};

const result = createBrandSchema.safeParse(mockFormValues);
console.log("Success:", result.success);
if (!result.success) {
  console.log("Errors:", JSON.stringify(result.error.format(), null, 2));
}
