import { PrismaClient } from '@prisma/client';
import { encryption, ImageGateway } from '@brandflow/ai';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env['ENCRYPTION_KEY'] || 'default_dev_encryption_key_32_bytes_min!';

async function run() {
  console.log('--- Fetching Business and Brand details ---');
  const business = await prisma.business.findFirst();
  if (!business) {
    console.error('No business found in database.');
    return;
  }
  console.log(`Using Business: ${business.name} (id: ${business.id})`);

  const brand = await prisma.brand.findFirst({
    where: { businessId: business.id }
  });
  if (!brand) {
    console.error('No brand found in database.');
    return;
  }
  console.log(`Using Brand: ${brand.name} (id: ${brand.id})`);

  // Get LLM settings
  const settings = await prisma.llmSettings.findUnique({
    where: { businessId: business.id }
  });
  if (!settings?.apiKey) {
    console.error('No API key found in LLM settings.');
    return;
  }
  const nvidiaKey = encryption.decrypt(settings.apiKey, ENCRYPTION_KEY);

  // Extract visual rules from brand
  const visualRules = (brand.visualRules as any) || {};
  console.log('Brand visual rules:', visualRules);

  // Build brand-aware poster prompt
  const colorStr = [visualRules.primaryColor, visualRules.secondaryColor, visualRules.accentColor]
    .filter(Boolean)
    .join(', ');

  const prompt = `Marketing poster creative, graphic design composition, modern premium corporate aesthetic, brand identity for "${brand.name}", industry: "${brand.industry}", dominant color palette: ${colorStr || 'deep blue, orange'}, bold headline typography reading "Innovate Your Future", clear visual hierarchy, geometric design accents, commercial advertising quality, 8K detail.`;
  console.log('Generated prompt:', prompt);

  // Initialize ImageGateway with decrypted key
  console.log('Initializing ImageGateway...');
  const gateway = new ImageGateway(
    { defaultProvider: 'nvidia' },
    { nvidia: nvidiaKey }
  );

  console.log('Generating image using NVIDIA provider (flux.2-klein-4b)...');
  const resolvedModel = (settings.nvidiaTaskModels as any)?.imageGeneration || 'black-forest-labs/flux.2-klein-4b';
  console.log(`Model requested: ${resolvedModel}`);

  try {
    const res = await gateway.generate('nvidia', {
      prompt,
      width: 1024,
      height: 1024,
      businessId: business.id,
      model: resolvedModel,
    });

    if (res.images && res.images.length > 0 && res.images[0].base64) {
      const base64Data = res.images[0].base64;
      const buffer = Buffer.from(base64Data, 'base64');
      const outputPath = path.join(__dirname, 'test-brand-poster.png');
      fs.writeFileSync(outputPath, buffer);
      console.log(`\nSUCCESS! Branded image saved to: ${outputPath}`);

      // Save directly into the BrandFlow database so it appears in the application
      console.log('Inserting Asset and GeneratedImage records into the database...');
      const fileName = `poster_verification_nvidia_${Date.now()}.png`;
      const asset = await prisma.asset.create({
        data: {
          businessId: business.id,
          brandId: brand.id,
          type: 'image',
          fileName,
          mimeType: 'image/png',
          s3Key: `assets/${business.id}/${brand.id}/posters/${fileName}`,
          cdnUrl: `data:image/png;base64,${base64Data}`,
          metadata: {
            finalPrompt: prompt,
            provider: 'nvidia',
            model: resolvedModel,
            costCents: res.costCents,
            category: 'SMO_POSTER',
            platform: 'instagram_post',
            isPoster: true,
            brandName: brand.name,
            isMock: false,
          },
        },
      });

      const genImg = await prisma.generatedImage.create({
        data: {
          businessId: business.id,
          brandId: brand.id,
          assetId: asset.id,
          width: 1024,
          height: 1024,
          aspectRatio: '1:1',
          promptUsed: prompt,
          metadata: {
            costCents: res.costCents,
            provider: 'nvidia',
            model: resolvedModel,
            seed: res.images[0].seed,
            category: 'SMO_POSTER',
            platform: 'instagram_post',
            isPoster: true,
          },
        },
      });

      console.log(`Database records created:`);
      console.log(`- Asset ID: ${asset.id}`);
      console.log(`- GeneratedImage ID: ${genImg.id}`);
      console.log('Image is now registered in the application!');
    } else {
      console.error('Failed: No image data returned', res);
    }
  } catch (err) {
    console.error('Generation failed:', err);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
