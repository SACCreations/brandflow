import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.llmSettings.findMany();
  let updatedCount = 0;
  
  for (const s of settings) {
    if (s.nvidiaTaskModels) {
      const models = s.nvidiaTaskModels as any;
      if (models.campaignStrategy === 'nvidia/llama-3.1-nemotron-70b-instruct' || models.campaignStrategy === 'nvidia/llama-3.1-nemotron-ultra-253b-v1') {
        models.campaignStrategy = 'meta/llama-3.1-70b-instruct';
        
        await prisma.llmSettings.update({
          where: { id: s.id },
          data: {
            nvidiaTaskModels: models
          }
        });
        updatedCount++;
      }
    }
  }
  console.log(`Successfully updated ${updatedCount} records to meta/llama-3.1-70b-instruct.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
