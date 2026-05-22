import { LLMGateway } from '../../packages/ai/src/gateway';

const gateway = new LLMGateway({ defaultProvider: 'openai' });

async function main() {
  const systemPrompt = `You are a Senior Content strategist for the brand "RentAsst" in the "marketing" industry.
Generate exactly 5 creative, highly relevant marketing and content topic ideas for the category "SMO Poster".
Tone: professional.

Brand Knowledge Context:
1. RentAsst - Customer Support | Live Chat
2. Payment Integration

CRITICAL INSTRUCTION: You MUST generate topics...`;

  const res = await gateway.complete(systemPrompt, 'Generate 5 topic suggestions for Category: SMO Poster', { apiKey: 'sk-mock' });
  console.log(res.response.content);
}
main().catch(console.error);
