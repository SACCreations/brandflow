const systemPrompt = `You are a Senior Content strategist for the brand "RentAsst" in the "marketing" industry.
Generate exactly 5 creative, highly relevant marketing and content topic ideas for the category "SMO Poster".
Tone: professional.

Brand Knowledge Context:
1. # ProcessDrive India - Transforming Business to Scale
Source: https://processdrive.com

CRITICAL INSTRUCTION: You MUST generate topics...`;

const factsMatch = systemPrompt.match(/Brand Knowledge Context:\n([\s\S]*?)\n+CRITICAL/i);
console.log(factsMatch ? factsMatch[1] : 'null');
