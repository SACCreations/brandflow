import { PrismaClient } from '@prisma/client';
import { VectorService } from '../ai/src/vector-service';

const prisma = new PrismaClient();
const vs = new VectorService();

async function main() {
  try {
    const brand = await prisma.brand.findFirst({ where: { name: 'RentAsst' } });
    if (!brand) return console.log('Brand not found');
    console.log('Brand ID:', brand.id);
    const facts = await vs.findRelevantContext(prisma, brand.businessId, 'RentAsst core offerings', 10, brand.id);
    console.log('Returned facts length:', facts.length);
    if (facts.length > 0) {
      console.log(facts[0].content);
    } else {
      console.log('No facts returned for this brand');
    }
  } catch(e) {
    console.error('Error!', e);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
