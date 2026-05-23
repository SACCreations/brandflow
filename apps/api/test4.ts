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
  const embedding = await vs.generateEmbedding('Social Media');
  const vectorString = `[${embedding.join(',')}]`;

  try {
    const results = await prisma.$queryRawUnsafe(`
      SELECT 
        ke.id, 
        ke.content, 
        ke.metadata, 
        ke.classification,
        1 - (ke.embedding <=> '${vectorString}'::vector) as similarity
      FROM "knowledge_entries" ke
      JOIN "knowledge_sources" ks ON ke."sourceId" = ks.id
      WHERE ke."businessId" = '${brand!.businessId}'
      AND ks."brandId" = '${brand!.id}'
      ORDER BY ke.embedding <=> '${vectorString}'::vector
      LIMIT 5
    `);
    console.log('Success:', results.length);
  } catch (err) {
    console.error('Error in pgvector:', err);
  }
}

run().finally(() => prisma.$disconnect());
