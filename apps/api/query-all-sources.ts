import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sources = await prisma.knowledgeSource.findMany({
    select: { id: true, sourceUrl: true }
  });
  console.log("Sources:");
  sources.forEach(s => console.log(s.id, s.sourceUrl));
}
main().finally(() => prisma.$disconnect());
