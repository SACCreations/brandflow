const { PrismaClient } = require('@prisma/client');

async function fix() {
  const prisma = new PrismaClient();
  await prisma.llmSettings.updateMany({
    where: { provider: 'nvidia' },
    data: { model: 'meta/llama-3.1-70b-instruct' }
  });
  console.log("Updated Nvidia model in DB.");
}
fix();
