export interface Automation {
  id: string;
  name: string;
  triggerType: string;
  triggerConfig: any;
  steps: any[];
  isActive: boolean;
  lastRunAt: string | null;
  createdAt: string;
  _count: {
    runs: number;
  };
}
