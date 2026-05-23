const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Recreating ai_request_logs table...');
  try {
    // Drop the snake_case structured table
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "ai_request_logs";`);
    
    // Create the table with exact camelCase columns matching schema.prisma exactly
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "ai_request_logs" (
        "id" TEXT PRIMARY KEY,
        "requestId" TEXT NOT NULL,
        "businessId" TEXT,
        "provider" TEXT NOT NULL,
        "model" TEXT NOT NULL,
        "latency" INTEGER NOT NULL,
        "inputTokens" INTEGER NOT NULL,
        "outputTokens" INTEGER NOT NULL,
        "success" BOOLEAN NOT NULL,
        "errorMessage" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table ai_request_logs recreated successfully with exact camelCase quoted columns!');
  } catch (error) {
    console.error('❌ Failed to recreate table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
