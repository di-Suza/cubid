export interface HealthStatus {
  status: 'ok';
  service: 'cubid-api';
  timestamp: string;
  uptimeSeconds: number;
}

export class HealthService {
  getStatus(): HealthStatus {
    return {
      status: 'ok',
      service: 'cubid-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime())
    };
  }
}

export const healthService = new HealthService();
