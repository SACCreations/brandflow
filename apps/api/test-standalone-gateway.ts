import { LLMGateway } from '@brandflow/ai';
import { WebConnector } from './src/modules/knowledge/connectors/web.connector';

async function main() {
  const connector = new WebConnector();
  const gateway = new LLMGateway({ defaultProvider: 'openai' });
  
  console.log("Crawling...");
  const text = await connector.crawl("https://rentasst.com/industries/industry/medical-rental");
  console.log("Text length:", text.length);
  
  // Clean and split
  const cleaned = text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  const chunk = cleaned.substring(0, 500); // just one chunk
  
  console.log("Chunk preview:", chunk.substring(0, 100));
  
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
${chunk}
  `.trim();

  console.log("Calling gateway...");
  const { response } = await gateway.complete(
    'You are a Brand Knowledge Extractor. You only output valid JSON objects.',
    prompt,
    { model: 'gpt-4o-mini', jsonMode: true }
  );
  
  console.log("Gateway response:");
  console.log(response.content);
}
main().catch(console.error);
