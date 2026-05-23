import { PrismaClient } from '@prisma/client';
import { LLMGateway } from '@brandflow/ai';

async function main() {
  const llm = new LLMGateway({ defaultProvider: 'openai' });
  const { response } = await llm.complete('You are a Brand Knowledge Extractor', 'Extract atoms');
  console.log('AI Response:', response.content);

  const cleanContent = response.content.replace(/```json/gi, '').replace(/```/g, '').trim();
  const data = JSON.parse(cleanContent);
  
  let atoms: any[] = [];
  if (Array.isArray(data)) {
    atoms = data;
  } else if (data && typeof data === 'object') {
    for (const val of Object.values(data)) {
      if (Array.isArray(val)) {
        atoms = val;
        break;
      }
    }
  }

  console.log('Parsed atoms length:', atoms.length);
  if (atoms.length > 0) {
    const mapped = atoms.map((a: any) => ({
      type: (a.type || a.classification || a.category || 'fact').toLowerCase(),
      content: a.content || a.text || a.fact || '',
      confidence: a.confidence ?? 0.8
    })).filter((a: any) => a.content.trim().length > 0);
    console.log('Mapped atoms:', mapped.length, mapped);
  }
}
main();
