import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const keywords = ['rentasst', 'processdrive'];

  console.log('Searching for Users...');
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'rentasst', mode: 'insensitive' } },
        { email: { contains: 'processdrive', mode: 'insensitive' } },
      ],
    },
  });
  console.log('Users:', users.length);

  console.log('Searching for Businesses...');
  const businesses = await prisma.business.findMany({
    where: {
      OR: [
        { name: { contains: 'rentasst', mode: 'insensitive' } },
        { name: { contains: 'processdrive', mode: 'insensitive' } },
        { slug: { contains: 'rentasst', mode: 'insensitive' } },
        { slug: { contains: 'processdrive', mode: 'insensitive' } },
      ],
    },
  });
  console.log('Businesses:', businesses.length);

  console.log('Searching for Brands...');
  const brands = await prisma.brand.findMany({
    where: {
      OR: [
        { website: { contains: 'rentasst', mode: 'insensitive' } },
        { website: { contains: 'processdrive', mode: 'insensitive' } },
        { name: { contains: 'rentasst', mode: 'insensitive' } },
        { name: { contains: 'processdrive', mode: 'insensitive' } },
      ],
    },
  });
  console.log('Brands:', brands.length);

  console.log('Searching for KnowledgeSources...');
  const ks = await prisma.knowledgeSource.findMany({
    where: {
      OR: [
        { sourceUrl: { contains: 'rentasst', mode: 'insensitive' } },
        { sourceUrl: { contains: 'processdrive', mode: 'insensitive' } },
      ],
    },
  });
  console.log('KnowledgeSources:', ks.length);
  for (const k of ks) {
    console.log(`- ${k.id}: ${k.sourceUrl}`);
  }

}

main().catch(console.error).finally(() => prisma.$disconnect());
