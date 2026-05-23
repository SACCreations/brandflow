import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const brand = await prisma.brand.findFirst({ where: { name: 'RentAsst' } });
  const entries = await prisma.$queryRawUnsafe(`
    SELECT ke.id, ke.content, ks."brandId"
    FROM "knowledge_entries" ke
    JOIN "knowledge_sources" ks ON ke."sourceId" = ks.id
    WHERE ks."brandId" = '${brand!.id}'
    ORDER BY ke."createdAt" DESC
    LIMIT 5
  `);
  console.log(entries);
}
main().catch(console.error).finally(() => prisma.$disconnect());
