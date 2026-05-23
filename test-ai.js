const { LLMGateway } = require('./packages/ai/dist/gateway');
const gateway = new LLMGateway({ defaultProvider: 'openai' });
async function main() {
  const result = await gateway.complete('You are an expert Brand Intelligence Engineer.', 'Extract atoms');
  console.log("Mock output:", result.response.content);
}
main().catch(console.error);
