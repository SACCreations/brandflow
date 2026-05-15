import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Initializing database extensions...');
  
  try {
    // 1. Enable pgvector
    console.log('  📦 Enabling pgvector...');
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('  ✅ pgvector enabled');
    
    // 2. Enable uuid-ossp (optional but good)
    console.log('  📦 Enabling uuid-ossp...');
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('  ✅ uuid-ossp enabled');
    
  } catch (error) {
    console.error('  ❌ Failed to initialize extensions:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
