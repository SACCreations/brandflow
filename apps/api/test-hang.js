const { PrismaClient } = require('@prisma/client');
const { encryption } = require('@brandflow/ai');
const { OpenAI } = require('openai');

async function run() {
  const prisma = new PrismaClient();
  const settings = await prisma.llmSettings.findFirst({ where: { provider: 'nvidia' } });
  
  const encryptionKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const apiKey = encryption.decrypt(settings.apiKey, encryptionKey);
  console.log("Decrypted key starts with:", apiKey.substring(0, 5));

  const client = new OpenAI({ 
    apiKey,
    baseURL: "https://integrate.api.nvidia.com/v1"
  });

  console.time('request');
  try {
    console.log("Sending request to Nvidia NIM...");
    const res = await client.chat.completions.create({
      model: settings.model,
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant validating the BrandFlow platform infrastructure.' },
        { role: 'user', content: 'Hello AI, please confirm your status and name the LLM provider you are currently running on.' }
      ],
      max_tokens: 500,
      temperature: 0.7
    });
    console.log(res);
  } catch (err) {
    console.error("Caught error:", err.message);
  }
  console.timeEnd('request');
}
run();
