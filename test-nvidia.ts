import { NvidiaProvider } from './packages/ai/src/providers/nvidia';

const apiKey = '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';
const provider = new NvidiaProvider(apiKey, 'meta/llama-3.1-70b-instruct');

async function run() {
  console.log("Starting NVIDIA request...");
  try {
    const res = await provider.complete({
      systemPrompt: "Return a JSON object with { foo: 'bar' }",
      userPrompt: "Hi",
      jsonMode: true,
      requestId: "123",
      model: "meta/llama-3.1-70b-instruct",
      temperature: 0.1
    });
    console.log("SUCCESS:", res);
  } catch (err: any) {
    console.error("ERROR:", err.message);
  }
}
run();
