import { Queue } from 'bullmq';
import IORedis from 'ioredis';

async function run() {
  const connection = new IORedis({ host: 'localhost', port: 6379, maxRetriesPerRequest: null });
  const queue = new Queue('brand-analysis', { connection });

  console.log('Adding test job...');
  const job = await queue.add('analyse', {
    businessId: '00000000-0000-0000-0001-000000000001',
    dto: {
       sources: [{ type: 'url', value: 'https://www.processdrive.com' }]
    }
  });
  
  console.log(`Job added: ${job.id}. Waiting for completion...`);
  
  let state = await job.getState();
  while (state !== 'completed' && state !== 'failed') {
    await new Promise(r => setTimeout(r, 2000));
    state = await job.getState();
  }
  
  console.log('Final state:', state);
  if (state === 'failed') {
    console.log('Reason:', job.failedReason);
  } else {
    console.log('Result:', job.returnvalue);
  }
  process.exit(0);
}
run().catch(console.error);
