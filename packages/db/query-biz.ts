import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const business = await prisma.business.findFirst();
  console.log('Business ID:', business?.id);
}
main().catch(console.error).finally(() => prisma.$disconnect());
