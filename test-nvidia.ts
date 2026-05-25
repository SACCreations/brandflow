import { NvidiaProvider } from './packages/ai/src/providers/nvidia';

const provider = new NvidiaProvider('0c6bf20c12af0f4fa8140d0b:b5c88520eaa7c032801f3c68031e0a2760bafd58be2a9a400f95693cfaaeb9014bdfb74381e6e505ea228d397b92859324ad92097542298dea78b2b1bd48cd0a786d985973db:43b7d776668d03f58ea9a865aed94d5a', 'meta/llama-3.1-70b-instruct');

async function run() {
  try {
    const res = await provider.complete({
      systemPrompt: "Return a JSON object with { foo: 'bar' }",
      userPrompt: "Hi",
      jsonMode: true,
      requestId: "123",
      model: "meta/llama-3.1-70b-instruct",
      temperature: 0.1
    });
    console.log(res);
  } catch (err: any) {
    console.error("ERROR:", err.message);
  }
}
run();
