import { AnthropicProvider } from './packages/ai/src/providers/anthropic';

async function run() {
  const provider = new AnthropicProvider('sk-ant-mock-anthropic-key-for-testing-purposes');
  try {
    const res = await provider.complete({
      systemPrompt: 'System prompt',
      userPrompt: 'User prompt',
      requestId: '123'
    });
    console.log(res);
  } catch (err: any) {
    console.error("ERROR:");
    console.error(err.message);
  }
}
run();
