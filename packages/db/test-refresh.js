const { PrismaClient } = require('@prisma/client');
async function run() {
  const prisma = new PrismaClient();
  const sessions = await prisma.session.findMany({ include: { user: true } });
  console.log(`Found ${sessions.length} sessions.`);
  if (sessions.length > 0) {
    console.log(`Expires at: ${sessions[0].expiresAt}`);
  }
}
run();
