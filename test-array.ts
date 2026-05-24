import { OpenAIProvider } from './packages/ai/src/providers/openai';
import { NvidiaProvider } from './packages/ai/src/providers/nvidia';
import { ConfigService } from '@nestjs/config';

// actually we just need to see if Nvidia API times out or hangs when given an array of messages
// wait, since we don't have the API key, we will get 401 instead of timeout, unless the client hangs before sending!
import OpenAI from 'openai';

async function test() {
  const client = new OpenAI({ 
    apiKey: 'dummy',
    baseURL: "https://integrate.api.nvidia.com/v1"
  });

  try {
    console.log("Sending array...");
    const response = await client.chat.completions.create({
      model: "moonshotai/kimi-k2.6",
      messages: [
        { role: 'system', content: "You are an AI" },
        { role: 'user', content: "Hello" } as any,
        { role: 'assistant', content: "Hi!" } as any,
        { role: 'user', content: "Test" } as any,
      ],
      max_tokens: 10,
    });
    console.log(response);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
test();
