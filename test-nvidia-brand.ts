import { NvidiaProvider } from './packages/ai/src/providers/nvidia';

const apiKey = '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';
const provider = new NvidiaProvider(apiKey, 'meta/llama-3.1-70b-instruct');

const systemPrompt = `You are BrandFlow's senior brand strategist and brand-governance analyst.
Perform a complete in-depth Brand DNA analysis based on the provided URL and evidence.
Return a single JSON object with a \`brand\` object only. No markdown, no prose.
Use only the supplied evidence. Do not invent facts.

The brand object must use this shape:
{
  "brand": {
    "name": "string",
    "tagline": "string | null",
    "description": "string | null",
    "industry": "string | null",
    "website": "string | null",
    "positioning": "string | null",
    "audience": "string | null",
    "differentiators": "string | null",
    "tone": ["string"],
    "governance": {
      "bannedPhrases": ["string"],
      "requiredPhrases": ["string"],
      "ctaPreferences": ["string"],
      "requiredDisclaimer": "string | null"
    },
    "visualRules": {
      "primaryColor": "string | null",
      "secondaryColor": "string | null",
      "accentColor": "string | null",
      "neutralColor": "string | null",
      "semanticColor": "string | null",
      "fontFamily": "string | null",
      "headingFont": "string | null",
      "bodyFont": "string | null",
      "supportingFont": "string | null",
      "backupFont": "string | null"
    }
  }
}`;

const userPrompt = `Analyze the evidence below and extract a usable brand draft for BrandFlow.
Source 1: Linear Website
URL: https://linear.app
Evidence:
Linear is a purpose-built tool for planning and building products. It is fast, beautiful, and developer-friendly. It features issue tracking, project roadmaps, and cycles. The design language uses dark slate backgrounds, high-contrast white text, clean borders, and keyboard shortcuts throughout. Colors are primarily deep dark grey/blue (#0f172a), with electric blue and emerald accents. Fonts used are Inter and custom geometric sans-serifs.`;

async function run() {
  console.log("Starting full Brand Analysis simulation on NVIDIA NIM...");
  const start = Date.now();
  try {
    const res = await provider.complete({
      systemPrompt,
      userPrompt,
      jsonMode: true,
      requestId: "123",
      model: "meta/llama-3.1-70b-instruct",
      temperature: 0.2,
      maxTokens: 2000
    });
    const duration = (Date.now() - start) / 1000;
    console.log(`SUCCESS in ${duration}s!`);
    console.log("RESPONSE:", res.content);
  } catch (err: any) {
    const duration = (Date.now() - start) / 1000;
    console.error(`FAILED after ${duration}s! Error:`, err.message);
  }
}
run();
