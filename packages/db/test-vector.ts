import { PrismaClient } from '@prisma/client';
import { VectorService } from '../ai/src/vector-service';

const prisma = new PrismaClient();
const vs = new VectorService();

async function main() {
  try {
    const facts = await vs.findRelevantContext(prisma, '00000000-0000-0000-0001-000000000001', 'RentAsst');
    console.log('Returned facts length:', facts.length);
    if (facts.length > 0) {
      console.log(facts[0].content);
    }
  } catch(e) {
    console.error('Error!', e);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
