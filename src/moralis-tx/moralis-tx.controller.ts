import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Request,
  Put,
} from "@nestjs/common";
import { TransactionService } from "./moralis-tx.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";

@Controller("moralis-tx")
export class MoralisTxController {
  constructor(private readonly moralisTxService: TransactionService) {}

  @Post("stream")
  stream(@Body() tx: any) {
    return this.moralisTxService.stream(tx);
  }

  @Get("tx-list")
  getTxList(@Query() query) {
    return this.moralisTxService.getTransactions(query);
  }

  @Get("withdraw-tron-links")
  getWithdrawTronPaymentFromLinks(@Query() query) {
    return this.moralisTxService.withdrawTronPaymentFromLinks();
  }

  @Get("check-bitcoin-links")
  checkBitcoinPaymentLinks(@Query() query) {
    return this.moralisTxService.processBitcoinPaymentLinks();
  }

  @Get("withdraw-bitcoin-links")
  getWithdrawBTCPaymentFromLinksAndUpdateStatus() {
    return this.moralisTxService.withdrawBTCPaymentFromLinksAndUpdateStatus();
  }

  @UseGuards(JwtAuthGuard)
  @Get("tron-balance")
  getTronBalance(@Query() query) {
    return this.moralisTxService.getTronBalanceAPI(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get("transfer-tron")
  transferTRON(@Query() query) {
    return this.moralisTxService.transferTRONAPI(query);
  }

  // @Get("cron-tron-deposit")
  // TRON_DIRECT_DEPOSIT_MONITOR() {
  //   return this.moralisTxService.TRON_DIRECT_DEPOSIT_MONITOR();
  // }

  // @Get("cron-bitcoin-deposit")
  // BITCOIN_DIRECT_DEPOSIT_MONITOR() {
  //   return this.moralisTxService.BITCOIN_DIRECT_DEPOSIT_MONITOR();
  // }
}
