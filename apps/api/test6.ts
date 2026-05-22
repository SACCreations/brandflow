import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  try {
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('Successfully created vector extension');
  } catch (err) {
    console.error('Failed to create vector extension:', err);
  }
}
run().finally(() => prisma.$disconnect());
