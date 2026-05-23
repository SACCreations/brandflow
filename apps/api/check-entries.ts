import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.knowledgeEntry.findMany({
    select: { classification: true }
  });
  
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    const c = entry.classification || 'null';
    counts[c] = (counts[c] || 0) + 1;
  }
  
  console.log('Database Entries Count by Classification:');
  console.log(JSON.stringify(counts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
