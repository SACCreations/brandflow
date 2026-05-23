import { tenantStorage } from '@brandflow/db';

export class TenantContext {
  static run<T>(tenantId: string, callback: () => T): T {
    return tenantStorage.run(tenantId, callback);
  }

  static getTenantId(): string | undefined {
    return tenantStorage.getStore();
  }
}
