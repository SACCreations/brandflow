import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const extensions = await prisma.$queryRaw`SELECT name, default_version, installed_version FROM pg_available_extensions WHERE name = 'vector';`;
  console.log('Available extensions:', JSON.stringify(extensions, null, 2));
  
  const version = await prisma.$queryRaw`SELECT version();`;
  console.log('Postgres version:', JSON.stringify(version, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
