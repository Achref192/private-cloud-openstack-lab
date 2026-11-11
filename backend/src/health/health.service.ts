import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as os from 'os';

@Injectable()
export class HealthService {
  private startTime = Date.now();

  constructor(@InjectConnection() private connection: Connection) {}

  async check() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    
    let dbStatus = 'disconnected';
    
    try {
      // Use the injected connection and ping
      if (this.connection.readyState === 1) {
        // readyState 1 = connected
        dbStatus = 'connected';
      } else if (this.connection.db) {
        // If db object exists, try to ping
        await this.connection.db.admin().ping();
        dbStatus = 'connected';
      }
    } catch (error) {
      dbStatus = 'disconnected';
    }

    return {
      status: 'ok',
      hostname: os.hostname(),
      db: dbStatus,
      uptime,
      version: process.env.APP_VERSION || '1.0.0',
    };
  }
}
