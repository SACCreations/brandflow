const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    await prisma.aIRequestLog.findMany({ take: 1 });
    console.log("AI query OK");
  } catch(e) {
    console.error("AI query error:", e.message);
  }
}
test().then(() => process.exit(0));
