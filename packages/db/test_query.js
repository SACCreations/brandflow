const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    await prisma.approval.findMany({
      where: { businessId: "test" },
      include: {
        content: {
          include: {
            brand: true,
            brief: { select: { id: true, objective: true, audience: true, cta: true } },
            campaign: { select: { id: true, name: true, status: true } },
            qualityChecks: { orderBy: { checkedAt: 'desc' }, take: 1 }
          }
        }
      }
    });
    console.log("Approval query OK");
  } catch(e) {
    console.error("Approval query error:", e.message);
  }
}
test().then(() => process.exit(0));
