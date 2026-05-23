const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    await prisma.chatMessage.findMany({ take: 1 });
    console.log("Chat query OK");
  } catch(e) {
    console.error("Chat query error:", e.message);
  }
}
test().then(() => process.exit(0));
