import { Module } from '@nestjs/common';
import { WalletMonitorService } from './wallet-monitor.service';
import { WalletMonitorController } from './wallet-monitor.controller';

@Module({
  controllers: [WalletMonitorController],
  providers: [WalletMonitorService],
})
export class WalletMonitorModule {}
