import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Seed system roles ────────────────────────────────────────
  const systemRoles = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'owner',
      permissions: ['*'],
      isCustom: false,
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'admin',
      permissions: [
        'brand:read', 'brand:write', 'brand:delete',
        'content:read', 'content:write', 'content:delete',
        'campaign:read', 'campaign:write', 'campaign:delete',
        'knowledge:read', 'knowledge:write',
        'approval:read', 'approval:write',
        'analytics:read',
        'social:read', 'social:write',
        'team:read', 'team:invite',
        'billing:read',
      ],
      isCustom: false,
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'editor',
      permissions: [
        'brand:read',
        'content:read', 'content:write',
        'campaign:read',
        'knowledge:read',
        'approval:read',
        'analytics:read',
      ],
      isCustom: false,
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'reviewer',
      permissions: [
        'content:read',
        'approval:read', 'approval:write',
        'campaign:read',
      ],
      isCustom: false,
    },
    {
      id: '00000000-0000-0000-0000-000000000005',
      name: 'viewer',
      permissions: [
        'brand:read',
        'content:read',
        'campaign:read',
        'analytics:read',
      ],
      isCustom: false,
    },
  ];

  for (const role of systemRoles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {},
      create: role,
    });
  }
  console.log('✅ System roles seeded');

  // ─── Seed demo business ───────────────────────────────────────
  const demoBusiness = await prisma.business.upsert({
    where: { slug: 'demo-business' },
    update: {},
    create: {
      id: '00000000-0000-0000-0001-000000000001',
      name: 'Demo Business',
      slug: 'demo-business',
      healthScore: 75,
    },
  });
  console.log('✅ Demo business seeded:', demoBusiness.slug);

  // ─── Seed demo subscription ───────────────────────────────────
  await prisma.subscription.upsert({
    where: { id: '00000000-0000-0000-0002-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0002-000000000001',
      businessId: demoBusiness.id,
      plan: 'growth',
      status: 'active',
      seatLimit: 10,
      tokenBudget: 500000,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('✅ Demo subscription seeded');

  // ─── Seed demo user ───────────────────────────────────────────
  const passwordHash = await argon2.hash('Demo@Password1!');
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@brandflow.io' },
    update: {},
    create: {
      id: '00000000-0000-0000-0003-000000000001',
      email: 'demo@brandflow.io',
      passwordHash,
      firstName: 'Demo',
      lastName: 'User',
    },
  });
  console.log('✅ Demo user seeded:', demoUser.email);

  // ─── Membership: demo user → demo business (owner) ───────────
  await prisma.membership.upsert({
    where: {
      userId_businessId: {
        userId: demoUser.id,
        businessId: demoBusiness.id,
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      businessId: demoBusiness.id,
      roleId: '00000000-0000-0000-0000-000000000001', // owner
    },
  });
  console.log('✅ Demo membership seeded');

  // ─── Seed demo brand ─────────────────────────────────────────
  await prisma.brand.upsert({
    where: { id: '00000000-0000-0000-0004-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0004-000000000001',
      businessId: demoBusiness.id,
      name: 'Demo Brand',
      positioning: 'The leading platform for AI-powered brand marketing',
      audience: 'Marketing teams at B2B SaaS companies',
      tone: ['professional', 'confident', 'innovative'],
      visualRules: {
        primaryColor: '#6366f1',
        secondaryColor: '#8b5cf6',
        fontFamily: 'Inter',
      },
      governance: {
        bannedPhrases: ['cheap', 'guaranteed', 'best in the world'],
        requiredDisclaimer: null,
        ctaPreferences: ['Learn more', 'Get started', 'Book a demo'],
      },
    },
  });
  console.log('✅ Demo brand seeded');

  // ─── Seed platform-level prompts ─────────────────────────────
  const platformPrompts = [
    {
      id: '00000000-0000-0000-0005-000000000001',
      module: 'social',
      layer: 'platform',
      name: 'LinkedIn Post Generator',
      template: `You are a professional LinkedIn content writer for {{brand_name}}.

Brand positioning: {{positioning}}
Target audience: {{audience}}
Tone: {{tone}}

Write a LinkedIn post about: {{topic}}

Requirements:
- Engaging hook in the first line
- Professional but conversational tone
- Include relevant insights or data points
- End with a thought-provoking question or clear CTA
- Optimal length: 150-300 words
- Do NOT use hashtags more than 3
- Do NOT use the following phrases: {{banned_phrases}}`,
    },
    {
      id: '00000000-0000-0000-0005-000000000002',
      module: 'compliance',
      layer: 'platform',
      name: 'Brand Compliance Checker',
      template: `You are a brand compliance checker for {{brand_name}}.

Governance rules:
- Banned phrases: {{banned_phrases}}
- Required tone: {{tone}}
- Brand positioning: {{positioning}}

Review the following content and check for:
1. Use of any banned phrases
2. Tone consistency with brand guidelines
3. Factual accuracy based on known claims
4. Appropriate CTA usage

Content to review:
{{content}}

Respond in JSON format:
{
  "passed": boolean,
  "confidenceScore": number (0-1),
  "violations": [{"type": string, "severity": "low"|"medium"|"high", "detail": string}]
}`,
    },
  ];

  for (const prompt of platformPrompts) {
    await prisma.prompt.upsert({
      where: { id: prompt.id },
      update: {},
      create: { ...prompt, isActive: true },
    });
  }
  console.log('✅ Platform prompts seeded');

  console.log('\n🎉 Database seeded successfully!');
  console.log('   Demo login: demo@brandflow.io / Demo@Password1!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
