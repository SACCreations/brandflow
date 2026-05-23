import { PrismaClient } from '@prisma/client';
import { VectorService } from '../../packages/ai/src/vector-service';

const prisma = new PrismaClient();
const vs = new VectorService();

async function run() {
  const sources = await prisma.knowledgeSource.findMany();
  if (sources.length === 0) return console.log('No sources');
  const brandId = sources[0].brandId;
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  
  console.log('Brand:', brand?.name);
  const results = await vs.findRelevantContext(
    prisma,
    brand!.businessId,
    'Social Media',
    5,
    brand!.id
  );

  console.log('Results length:', results.length);
  if (results.length > 0) {
    console.log('Sample context:', results[0].content);
  } else {
    console.log('No results found for brandId', brandId);
  }
}

run().finally(() => prisma.$disconnect());
