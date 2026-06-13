import { NvidiaImageProvider } from '../../packages/ai/src/providers/nvidia-image';

async function main() {
  const apiKey = process.env['NVIDIA_API_KEY'];
  if (!apiKey) throw new Error("No key");
  const provider = new NvidiaImageProvider(apiKey);
  
  const prompt = `Marketing poster creative, graphic design composition, modern-premium aesthetic, Instagram Post format poster design, balanced square layout with centered typography hierarchy and geometric graphic elements, dominant brand color palette: #0565FF, #0056b3, #C72C91, brand colors used throughout all design elements, brand identity for "Kissflow", bold headline typography zone reading "Poster Image:", supporting subheadline text zone: "A visually appealing graphic with a simple, yet powerful design.", prominent call-to-action button zone: "(CTA):**", hero visual element: abstract geometric shapes in brand colors, dynamic diagonal composition, modern gradient overlay, business-relevant icon motif, brand logo placeholder zone at top-left corner with wordmark, professional white space balance, clean typographic hierarchy, geometric design accents, premium marketing layout, modern sans-serif typography, clear visual hierarchy, ultra-sharp focus, professional marketing artwork, commercial advertising quality, print-ready resolution, 8K detail, vibrant colors, highly polished finish\n\nCRITICAL RULES - DO NOT INCLUDE ANY OF THE FOLLOWING: generic office meeting, business handshake, corporate conference room, office hallway, generic workspace interior, stock photo, stock photography, generic business people, people sitting at desk, random corporate people, aerial city view, random cityscapes, generic landscapes, random landscape photos, earth from space, photorealistic photo of people, candid photograph, documentary photo, selfie`;

  console.log("Generating with prompt length:", prompt.length);
  const res = await provider.generate({ prompt, width: 1024, height: 1024, businessId: 'test' });
  console.log("Success! Generated image.");
}
main().catch(console.error);
