import { Controller } from '@nestjs/common';
import { WalletMonitorService } from './wallet-monitor.service';

@Controller('wallet-monitor')
export class WalletMonitorController {
  constructor(private readonly walletMonitorService: WalletMonitorService) {}
}
