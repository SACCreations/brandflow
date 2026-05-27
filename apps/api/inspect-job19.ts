import { Queue } from 'bullmq';
import IORedis from 'ioredis';

async function run() {
  const connection = new IORedis({ host: 'localhost', port: 6379, maxRetriesPerRequest: null });
  const queue = new Queue('brand-analysis', { connection });
  const job = await queue.getJob('19');
  if (job) {
    const state = await job.getState();
    console.log('State:', state);
    if (state === 'failed') {
      console.log('Error:', job.failedReason);
    } else if (state === 'completed') {
      console.log('Result:', job.returnvalue?.brand?.name);
    }
  } else {
    console.log('Job 19 not found');
  }
  process.exit(0);
}
run().catch(console.error);
