import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBrandSchema } from "./packages/shared/src/validators/index.ts";

const schema = z.object({
  industry: z.string().min(1, 'Industry is required').max(100),
});

const result = schema.safeParse({ industry: "" });
console.log("Empty string:", result.success);

const result2 = schema.safeParse({ industry: undefined });
console.log("Undefined:", result2.success);

const result3 = schema.safeParse({});
console.log("Empty object:", result3.success);
