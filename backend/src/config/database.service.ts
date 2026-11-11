import { Injectable } from '@nestjs/common';
import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Injectable()
export class DatabaseService implements MongooseOptionsFactory {
  private reconnectInterval: NodeJS.Timeout;
  private isConnected = false;

  createMongooseOptions(): MongooseModuleOptions {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/cloudmetrics';

    // Remove existing listeners to avoid duplicates
    mongoose.connection.removeAllListeners('connected');
    mongoose.connection.removeAllListeners('disconnected');
    mongoose.connection.removeAllListeners('error');

    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'MongoDB connected',
      }));
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }
    });

    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'MongoDB disconnected',
      }));
      this.scheduleReconnect();
    });

    mongoose.connection.on('error', (err) => {
      this.isConnected = false;
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'MongoDB error',
        error: err.message,
      }));
    });

    return {
      uri,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: true,
      autoCreate: true,
    };
  }

  private scheduleReconnect() {
    if (this.reconnectInterval) return;
    
    this.reconnectInterval = setInterval(() => {
      if (!this.isConnected) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Attempting to reconnect to MongoDB',
        }));
      }
    }, 5000);
  }

  getConnectionStatus(): string {
    const state = mongoose.connection.readyState;
    return state === 1 ? 'connected' : 'disconnected';
  }
}
