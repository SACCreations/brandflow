import { IngestionService } from './src/modules/knowledge/ingestion.service';
import { PrismaClient } from '@prisma/client';
import { LLMGateway, TextSplitter, VectorService } from '@brandflow/ai';

async function main() {
  const llm = new LLMGateway({ defaultProvider: 'openai' });
  
  const text = 'This is a test feature: Auto-scaling. This feature helps scale automatically.';
  const prompt = `
You are an expert Brand Intelligence Engineer.
Extract "Identity Atoms" from the text below.
An Identity Atom is an atomic, self-contained fact about a brand, product, audience, or guideline.

Classify each atom as one of EXACTLY these strings:
[product, feature, faq, claim, pricing, testimonial, audience, objective, guideline, legal, fact]

Rules:
- Each atom must be self-contained.
- Assign confidence 0.0–1.0 based on how explicit the fact is.
- Do NOT hallucinate.
- Return ONLY a valid JSON object containing an "atoms" array. Example: {"atoms": [{"type":"<classification_from_list>","content":"...","confidence":0.9}]}

Text:
${text}
  `.trim();

  try {
    console.log('Calling AI Gateway...');
    const { response } = await llm.complete(
      'You are a Brand Knowledge Extractor. You only output valid JSON objects.',
      prompt,
      { model: 'gpt-4o-mini', jsonMode: true }
    );
    console.log('Response:', response.content);
  } catch (err) {
    console.error('Error:', err);
  }
}

main().catch(console.error);
