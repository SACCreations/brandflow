import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const result = await prisma.llmSettings.updateMany({
    where: {
      businessId: '00000000-0000-0000-0001-000000000001',
    },
    data: {
      model: 'meta/llama-3.1-70b-instruct',
    },
  });
  console.log("Updated rows:", result.count);
  
  const updatedSettings = await prisma.llmSettings.findMany();
  console.log("Updated Settings:", updatedSettings);
}

run().catch(console.error).finally(() => prisma.$disconnect());
