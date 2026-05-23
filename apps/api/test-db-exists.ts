import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

async function main() {
  const prisma = new PrismaClient();
  
  // Find the exact entries that were inserted at 17:45
  const entries = await prisma.knowledgeEntry.findMany({
    where: { createdAt: { gte: new Date('2026-05-22T17:40:00Z') } },
    select: { content: true, contentHash: true }
  });
  
  console.log("Number of entries:", entries.length);
  const uniqueContents = new Set(entries.map(e => e.content));
  console.log("Unique contents:", Array.from(uniqueContents));
}
main().finally(() => prisma.$disconnect());
