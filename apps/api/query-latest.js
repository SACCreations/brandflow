const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const latestContent = await prisma.content.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('--- LATEST CONTENT ---');
  console.log(JSON.stringify(latestContent, null, 2));

  const latestJobs = await prisma.imageGenerationJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('--- LATEST IMAGE JOBS ---');
  console.log(JSON.stringify(latestJobs, null, 2));
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
