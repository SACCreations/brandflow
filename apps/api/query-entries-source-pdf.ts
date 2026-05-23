import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.knowledgeEntry.findMany({
    where: { sourceId: '3c174611-588e-43d7-a1c0-ccd95cafac93' } // PDF source ID
  });
  console.log("PDF entries:", entries.length);
}
main().finally(() => prisma.$disconnect());
