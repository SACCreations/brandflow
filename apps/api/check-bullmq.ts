import { Queue } from 'bullmq';
import IORedis from 'ioredis';

async function run() {
  const connection = new IORedis({ host: 'localhost', port: 6379, maxRetriesPerRequest: null });
  const queue = new Queue('brand-analysis', { connection });
  const failed = await queue.getFailed(0, 10);
  console.log("Failed jobs:");
  for (const job of failed) {
    console.log(`Job ${job.id}:`, job.failedReason);
  }
  process.exit(0);
}
run().catch(console.error);
