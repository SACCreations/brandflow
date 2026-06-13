const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const jobs = await prisma.imageGenerationJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, status: true, rawPrompt: true, finalPrompt: true }
  });
  console.log(JSON.stringify(jobs, null, 2));
}
main().finally(() => prisma.$disconnect());
