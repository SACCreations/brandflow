import { ImageGateway } from '@brandflow/ai';

async function test() {
  console.log('Initializing ImageGateway...');
  const gateway = new ImageGateway({ defaultProvider: 'stability' });
  
  console.log('Generating image with preferred provider stability...');
  try {
    const res = await gateway.generate('stability', {
      prompt: 'Vibrant neon abstract software architecture, modern high contrast look',
      width: 1024,
      height: 1024,
      businessId: 'test-business',
    });
    console.log('Generation SUCCESS!');
    console.log('Response:', JSON.stringify(res, null, 2));
  } catch (err: any) {
    console.error('Generation FAILED:', err.message);
    if (err.stack) console.error(err.stack);
  }
}

test();
