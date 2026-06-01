const { z } = require("zod");

const schema = z.object({
  industry: z.string().min(1, 'Industry is required').max(100),
});

console.log("Empty string:", schema.safeParse({ industry: "" }).success);
console.log("Undefined:", schema.safeParse({ industry: undefined }).success);
console.log("Empty object:", schema.safeParse({}).success);
console.log("Spaces:", schema.safeParse({ industry: "   " }).success);
