import { Queue } from 'bullmq';
import IORedis from 'ioredis';

async function check() {
  const connection = new IORedis('redis://localhost:6379');
  const queue = new Queue('brand-analysis', { connection });
  
  const failed = await queue.getFailed(0, 5);
  console.log('Failed jobs:', failed.map(j => ({ id: j.id, failedReason: j.failedReason, data: j.data })));
  
  const active = await queue.getActive(0, 5);
  console.log('Active jobs:', active.map(j => ({ id: j.id, data: j.data })));

  const waiting = await queue.getWaiting(0, 5);
  console.log('Waiting jobs:', waiting.map(j => ({ id: j.id, data: j.data })));
  
  process.exit(0);
}

check().catch(console.error);
