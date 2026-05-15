import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const tables = [
  'businesses',
  'memberships',
  'subscriptions',
  'customers',
  'projects',
  'audit_logs',
  'cost_events',
  'brands',
  'knowledge_sources',
  'knowledge_entries',
  'knowledge_relationships',
  'knowledge_reviews',
  'knowledge_jobs',
  'knowledge_audits',
  'prompts',
  'quality_checks',
  'campaigns',
  'briefs',
  'contents',
  'assets',
  'templates',
  'social_accounts',
  'approvals',
  'schedules',
  'publish_jobs',
  'notifications',
  'automations',
  'automation_runs',
  'analytics_events',
  'performance_metrics',
  'llm_settings',
];

async function main() {
  console.log('🚀 Starting RLS setup...');

  for (const table of tables) {
    try {
      console.log(`  🔒 Enabling RLS for ${table}...`);
      
      // 1. Enable RLS
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      
      // 2. Drop existing policy if any
      await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "${table}_isolation_policy" ON "${table}";`);
      
      // 3. Create isolation policy
      // We use current_setting('app.current_tenant_id', true) which returns NULL if not set
      // We compare it to the businessId. 
      // Note: businesses table itself might need a different policy if we want to allow 
      // users to see their own business, or if it's the 'root' of the check.
      // For businesses, the policy should be: id::text = current_setting(...)
      
      if (table === 'businesses') {
        await prisma.$executeRawUnsafe(`
          CREATE POLICY "${table}_isolation_policy" ON "${table}"
          USING ("id"::text = current_setting('app.current_tenant_id', true));
        `);
      } else {
        await prisma.$executeRawUnsafe(`
          CREATE POLICY "${table}_isolation_policy" ON "${table}"
          USING ("businessId"::text = current_setting('app.current_tenant_id', true));
        `);
      }
      
      console.log(`  ✅ RLS enabled for ${table}`);
    } catch (error) {
      console.error(`  ❌ Failed to enable RLS for ${table}:`, error);
    }
  }

  console.log('✨ RLS setup complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
