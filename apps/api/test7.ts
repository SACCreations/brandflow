import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const ke: any = await prisma.$queryRawUnsafe(`SELECT embedding FROM "knowledge_entries" LIMIT 1`);
  if (ke && ke.length > 0) {
    console.log('Embedding type:', typeof ke[0].embedding);
    console.log('Embedding value:', ke[0].embedding);
  } else {
    console.log('No entries');
  }
}
run().finally(() => prisma.$disconnect());
