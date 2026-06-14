/**
 * Direct NVIDIA NIM image generation test
 * Run: node test-nvidia-direct.mjs
 */
import crypto from 'crypto';
import fs from 'fs';

// The encryption key from .env
const ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

// Encrypted API keys from DB
const ENCRYPTED_NVIDIA_KEY = 'edc90d5b7db1c9a56566a40c:8a7e0b95a9fb13b5621bd4bdced40a7e4032bc285f7130ffb1d9e7e0a84728c1dfc7d7ff56e166647e8258a943f4d9a5b2f880ac2dc5551ca252dac272298d63781023a3c74a:4589c07ee8502ce68e9debabe29b0df7';
const ENCRYPTED_IMAGE_KEY = 'a02fc757ff3ada29a94e35ce:0105d8296623ceec9d75607f9d7098ff6999a290a691ef838fdf5c0ec349a90c05b831b22e2865cad2e780d645bffd89c1291adf91968803bf7fb68ab474d447ec8d5987a892b50016e094e7ac159ce012566fd6f43984e3cf8adf3b4e1dcea1e15aea4f387aca9d8ac7e65d5d29b7dce54f9b7ae940fab381361c9adb4a5c87d6dba3b42b2f2b2ea373c2b4c887aa1e616330d52ba05781fed29f3bc760d0ba9b50fba3:a7dfeef7505a982ca19f6091cccc8d89';

function decrypt(encrypted, hexKey) {
  const keyBuffer = Buffer.from(hexKey, 'hex');
  const parts = encrypted.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted format');
  
  const iv = Buffer.from(parts[0], 'hex');
  const content = Buffer.from(parts[1], 'hex');
  const authTag = Buffer.from(parts[2], 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([decipher.update(content), decipher.final()]);
  return decrypted.toString('utf8');
}

async function testNvidia(apiKey, model = 'black-forest-labs/flux.2-klein-4b') {
  console.log(`\n🧪 Testing NVIDIA NIM with model: ${model}`);
  console.log(`🔑 API Key starts with: ${apiKey.substring(0, 15)}...`);
  
  const prompt = 'Marketing poster creative, graphic design composition, modern premium aesthetic, bold typography, professional brand design, vibrant colors';
  
  // Use valid NVIDIA NIM dimensions (multiples of 16, within [512, 1568])
  const width = 1024;
  const height = 1024;
  
  const payload = {
    prompt: prompt.substring(0, 800),
    seed: 42,
    steps: 4,
    width,
    height,
    samples: 1,
  };
  
  console.log(`📐 Dimensions: ${width}x${height}`);
  console.log(`📝 Prompt (${prompt.length} chars): ${prompt.substring(0, 100)}...`);
  
  const url = `https://ai.api.nvidia.com/v1/genai/${model}`;
  console.log(`🌐 URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ Error response: ${errText.substring(0, 500)}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ Success! Response keys: ${Object.keys(data).join(', ')}`);
    
    if (data.artifacts && data.artifacts.length > 0) {
      const art = data.artifacts[0];
      const base64 = art.base64 || art.blob;
      if (base64) {
        const imgBuffer = Buffer.from(base64, 'base64');
        const outPath = `/tmp/nvidia-test-${Date.now()}.png`;
        fs.writeFileSync(outPath, imgBuffer);
        console.log(`🖼️  Image saved to: ${outPath} (${Math.round(imgBuffer.length / 1024)}KB)`);
        return true;
      }
    }
    
    console.log('Response data:', JSON.stringify(data).substring(0, 500));
    return false;
    
  } catch (err) {
    console.error(`❌ Fetch error:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🔐 Decrypting API keys...');
  
  let nvidiaKey, imageKey;
  
  try {
    nvidiaKey = decrypt(ENCRYPTED_NVIDIA_KEY, ENCRYPTION_KEY);
    console.log(`✅ NVIDIA key decrypted: ${nvidiaKey.substring(0, 20)}... (${nvidiaKey.length} chars)`);
  } catch (e) {
    console.error('❌ Failed to decrypt NVIDIA key:', e.message);
  }
  
  try {
    imageKey = decrypt(ENCRYPTED_IMAGE_KEY, ENCRYPTION_KEY);
    console.log(`✅ Image key decrypted: ${imageKey.substring(0, 20)}... (${imageKey.length} chars)`);
  } catch (e) {
    console.error('❌ Failed to decrypt image key:', e.message);
  }
  
  // Test NVIDIA key with FLUX model
  if (nvidiaKey) {
    await testNvidia(nvidiaKey, 'black-forest-labs/flux.2-klein-4b');
    
    // Also try with stable diffusion model which is more forgiving
    console.log('\n--- Trying alternate model ---');
    await testNvidia(nvidiaKey, 'stabilityai/stable-diffusion-xl');
  }
  
  // Test image key (likely OpenAI) - just check what it is
  if (imageKey) {
    if (imageKey.startsWith('sk-')) {
      console.log('\n🔑 Image API key appears to be an OpenAI key');
      console.log('Testing OpenAI DALL-E 3...');
      
      try {
        const res = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${imageKey}`,
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: 'Marketing poster, professional design, brand creative',
            n: 1,
            size: '1024x1024',
          }),
        });
        console.log(`OpenAI status: ${res.status}`);
        const body = await res.json();
        if (res.ok) {
          console.log('✅ OpenAI DALL-E 3 working! Image URL:', body.data?.[0]?.url?.substring(0, 60) + '...');
        } else {
          console.log('❌ OpenAI error:', JSON.stringify(body).substring(0, 300));
        }
      } catch (e) {
        console.error('OpenAI fetch error:', e.message);
      }
    } else {
      console.log(`\n🔑 Image API key type: ${imageKey.substring(0, 30)}...`);
    }
  }
}

main().catch(console.error);
