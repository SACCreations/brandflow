import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sources = await prisma.knowledgeSource.findMany({
    select: { name: true, sourceUrl: true, status: true }
  });
  console.log("Current Sources:", sources);

  const jobs = await prisma.knowledgeJob.findMany({
    select: { status: true, error: true }
  });
  console.log("Jobs:", jobs);
}
main().finally(() => prisma.$disconnect());
