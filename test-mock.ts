import { LLMGateway } from './packages/ai/src/gateway';

const gateway = new LLMGateway({ defaultProvider: 'openai' });

async function main() {
  const systemPrompt = `You are BrandFlow's senior brand strategist. Perform a complete in-depth Brand DNA analysis.`;

  const res = await gateway.complete(systemPrompt, 'Generate 5 topic suggestions for Category: SMO Poster');
  console.log(res.response.content);
}
main().catch(console.error);
