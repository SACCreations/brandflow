import { Queue } from 'bullmq';
import IORedis from 'ioredis';

async function check() {
  const connection = new IORedis('redis://localhost:6379');
  const queue = new Queue('brand-analysis', { connection });
  
  const job = await queue.getJob('15');
  if (job) {
    console.log(JSON.stringify(job.returnvalue, null, 2).slice(0, 5000));
  } else {
    console.log('Job 15 not found');
  }
  process.exit(0);
}

check().catch(console.error);
