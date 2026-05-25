const Anthropic = require('@anthropic-ai/sdk');
async function test() {
  const client = new Anthropic({ apiKey: 'sk-ant-mock-anthropic-key-for-testing-purposes' });
  console.time('anthropic');
  try {
    await client.messages.create({
      model: 'gpt-4o',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'test' }]
    });
  } catch (err) {
    console.error("Caught:", err.message);
  }
  console.timeEnd('anthropic');
}
test();
