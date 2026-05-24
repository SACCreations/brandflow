import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const settings = await prisma.llmSettings.findMany();
  console.log(settings);
}
run();
