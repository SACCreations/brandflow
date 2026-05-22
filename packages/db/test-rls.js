const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const res = await prisma.knowledgeEntry.create({
      data: {
        businessId: "test-biz",
        sourceId: "8e0331d1-abe6-4f3f-aad8-01dcd732ff0a",
        content: "test",
        classification: "fact",
        confidence: 0.9,
      }
    });
    console.log("Created:", res.id);
  } catch (e) {
    console.log("Error:", e.message);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
