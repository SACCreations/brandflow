import { PrismaClient } from '@prisma/client';
import { VectorService } from './packages/ai/src/vector-service';

const prisma = new PrismaClient();
const vs = new VectorService();

async function main() {
  const facts = await vs.findRelevantContext(prisma, '00000000-0000-0000-0001-000000000001', 'test query', 10);
  console.log('Returned facts length:', facts.length);
  if (facts.length > 0) {
    console.log(facts[0].content);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
