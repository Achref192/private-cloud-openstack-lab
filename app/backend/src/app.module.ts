import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksModule } from './tasks/tasks.module';
import { HealthModule } from './health/health.module';
import { DatabaseService } from './config/database.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useClass: DatabaseService,
    }),
    TasksModule,
    HealthModule,
  ],
})
export class AppModule {}
