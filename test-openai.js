const { OpenAI } = require('openai');
const client = new OpenAI({ apiKey: 'dummy', baseURL: 'https://integrate.api.nvidia.com/v1' });
client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'hi' }]
}).then(console.log).catch(console.error);
