const userPrompt = `Text:\nhello\n---\nworld`;
const textMatch = userPrompt.match(/Text:\n([\s\S]*)/i);
console.log(textMatch ? textMatch[1] : "null");
