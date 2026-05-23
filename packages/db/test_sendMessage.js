const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    const convo = await prisma.conversation.findFirst();
    if(!convo) {
        console.log("No convo");
        return;
    }
    // try to fetch llmSettings
    await prisma.llmSettings.findUnique({ where: { businessId: convo.businessId }});
    console.log("All good");
  } catch(e) {
    console.error("error:", e.message);
  }
}
test().then(() => process.exit(0));
