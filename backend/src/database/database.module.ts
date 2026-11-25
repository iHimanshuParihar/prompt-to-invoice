import { Global, Module } from '@nestjs/common';
import { DataStoreService } from './data-store';

@Global()
@Module({
  providers: [DataStoreService],
  exports: [DataStoreService],
})
export class DatabaseModule {}
