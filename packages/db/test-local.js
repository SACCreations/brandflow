const { PrismaClient } = require('@prisma/client');
async function test() {
  const prisma = new PrismaClient();
  const settings = await prisma.llmSettings.findMany();
  console.log("LLM Settings in DB:", settings);
}
test();
