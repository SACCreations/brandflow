const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { randomUUID } = require('crypto');

async function test() {
  const c = await prisma.conversation.findFirst();
  if (!c) return console.log("No convo");
  
  // mock LLMGateway error if any? No, let's just insert a message
  try {
    await prisma.chatMessage.create({
        data: {
          conversationId: c.id,
          role: 'assistant',
          content: "test",
          provider: "openai",
          model: "gpt-4o",
          latency: 100,
          inputTokens: 10,
          outputTokens: 10,
        },
      });
      console.log("Insert OK");
  } catch(e) {
      console.error("Insert error:", e);
  }
}
test().then(() => process.exit(0));
