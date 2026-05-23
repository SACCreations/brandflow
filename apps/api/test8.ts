import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const entries = await prisma.knowledgeEntry.findMany();
  for(let e of entries.slice(0, 5)) {
    console.log(e.content);
  }
}
run().finally(() => prisma.$disconnect());
