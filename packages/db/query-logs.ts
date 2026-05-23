import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sources = await prisma.knowledgeSource.findMany({
    where: { sourceUrl: 'https://rentasst.com/blogs' },
    select: { id: true, sourceUrl: true }
  });
  
  if (sources.length > 0) {
    const logs = await prisma.knowledgeIngestionLog.findMany({
      where: { sourceId: sources[0].id }
    });
    console.log("Logs for blogs:", logs);
  }

  const pdfSources = await prisma.knowledgeSource.findMany({
    where: { sourceUrl: { contains: 'pdf' } },
    select: { id: true, sourceUrl: true }
  });

  if (pdfSources.length > 0) {
    const logs = await prisma.knowledgeIngestionLog.findMany({
      where: { sourceId: pdfSources[0].id }
    });
    console.log("Logs for PDF:", logs);
  }
}
main().finally(() => prisma.$disconnect());
