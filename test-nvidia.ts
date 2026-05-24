import { NvidiaProvider } from './packages/ai/src/providers/nvidia';

async function test() {
  const provider = new NvidiaProvider('test_key'); // we just want to see the error
  try {
    await provider.complete({
      systemPrompt: 'You are an AI',
      userPrompt: 'Hello',
      maxTokens: 10,
      temperature: 0.7,
      requestId: '123'
    });
  } catch (err: any) {
    console.error(err);
  }
}
test();
