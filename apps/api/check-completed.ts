import { Queue } from 'bullmq';
import IORedis from 'ioredis';

async function check() {
  const connection = new IORedis('redis://localhost:6379');
  const queue = new Queue('brand-analysis', { connection });
  
  const completed = await queue.getCompleted(0, 5);
  console.log('Completed jobs:', completed.map(j => ({ id: j.id, returnvalue: j.returnvalue })));
  
  process.exit(0);
}

check().catch(console.error);
