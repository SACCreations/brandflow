import { Queue } from 'bullmq';
import IORedis from 'ioredis';

async function run() {
  const connection = new IORedis({ host: 'localhost', port: 6379, maxRetriesPerRequest: null });
  const queue = new Queue('brand-analysis', { connection });
  const job = await queue.getJob('19');
  console.log('State:', await job?.getState());
  console.log('Result:', JSON.stringify(job?.returnvalue, null, 2));
  process.exit(0);
}
run().catch(console.error);
