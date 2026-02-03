import {
  Body,
  Controller,
  Get,
  Ip,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { PaymentLinkService } from "./payment-link.service";
import {
  AddPaymnetLinkDto,
  DepositFundDto,
  FundWithdrawDto,
  GetPaymentLinkTronBalance,
  TableDataDto,
} from "./dto/payment-link.dto";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { Permissions } from "src/auth/decorators/permissions.decorator";
import { Permission } from "src/auth/enums/role.enum";

@Controller("payment-link")
export class PaymentLinkController {
  constructor(private readonly paymentLinkService: PaymentLinkService) {}

  @Post("add")
  addPaymentLink(@Body() dto: AddPaymnetLinkDto, @Ip() clientIp: string, @Request() req) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || clientIp;
    return this.paymentLinkService.addPaymentLink(dto, ip);
  }

  @Get("wallet-transaction")
  getWalletTransaction(@Query() query) {
    return this.paymentLinkService.getWalletERC20Transactions(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get("merchant-tx-list")
  getMerchantTxList(@Query() query, @Request() req) {
    const { user } = req;
    return this.paymentLinkService.getMerchantTransactions(query, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get("merchant-tx-id")
  getMerchantTxById(@Query() query) {
    return this.paymentLinkService.getMerchantTransactionById(query);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.PAYMENT_MANAGEMENT)
  @Get("admin-all-payments")
  getAllPaymentLinks(@Query() query, @Request() req) {
    const { user } = req;
    return this.paymentLinkService.getAllPaymentLinks(query, user);
  }

  @Get("get-tx-status")
  getPaymentLinksById(@Query() query) {
    return this.paymentLinkService.getPaymentLinksById(query);
  }

  @Post("count")
  paymentLinkCount(@Body() body) {
    return this.paymentLinkService.count(body);
  }

  @Post("admin-fee-sum")
  adminFeeCount(@Body() body) {
    return this.paymentLinkService.revenue(body);
  }

  @Post("crypto-margins")
  cryptoMargins(@Body() body) {
    return this.paymentLinkService.cryptoMargins(body);
  }

  @Post("merchant-depositWithdraw")
  depositsWithdrawalsCount(@Body() body) {
    return this.paymentLinkService.merchantDepositWithdrawals(body);
  }

  @Get("merchant-paymentLink")
  merchantPaymentLink(@Query() query) {
    return this.paymentLinkService.activePaymentLinks(query);
  }

  @Get("merchant-apps")
  merchantActiveApps(@Query() query) {
    return this.paymentLinkService.activeMerchantApps(query);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.PAYMENT_MANAGEMENT)
  @Post("deposit-tx-fee-by-admin")
  depositTxFeeByAdmin(@Request() req, @Body() dto: DepositFundDto) {
    const { user } = req;
    return this.paymentLinkService.depositTxFeeByAdmin(user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("withdraw-fund")
  withdrawFund(@Request() req, @Body() dto: FundWithdrawDto) {
    const { user } = req;
    return this.paymentLinkService.withdrawFund(user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("merchant-payment-links-fund")
  getUserPaymentsLinksAmountSum(@Request() req) {
    const { user } = req;
    return this.paymentLinkService.getUserPaymentsLinksAmountSum(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get("merchant-fund-sum")
  getUserBalanceSum(@Query() query, @Request() req) {
    const { user } = req;
    return this.paymentLinkService.getUserBalanceSum(query, user);
  }

  @Get("crypto-symbols")
  getMerchantCryptoSymbols() {
    return this.paymentLinkService.getMerchantCryptoSymbols();
  }

  @Post("table-count-payment-links")
  tablePaymentLinkCount(@Body() dto: TableDataDto) {
    return this.paymentLinkService.tablePaymentLinkCount(dto);
  }

  @Post("table-count-merchant-deposit-withdraw")
  tableMerchantDepositWithdrawCount(@Body() dto: TableDataDto) {
    return this.paymentLinkService.tableMerchantDepositWithdrawCount(dto);
  }

  @Post("table-merchant-app-revenue-report")
  tableRevenueReportCount(@Body() dto: TableDataDto) {
    return this.paymentLinkService.tableMerchantAppTxRevenueReports(dto);
  }

  @Post("table-payment-link-revenue-report")
  tablePaymentLinkRevenueReportCount(@Body() dto: TableDataDto) {
    return this.paymentLinkService.tablePaymentLinkRevenueReports(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.PAYMENT_MANAGEMENT)
  @Post("admin-paymentlink-fund-withdraw")
  withdrawPaymentLinkFundsByAdmin(
    @Request() req,
    @Body() dto: FundWithdrawDto
  ) {
    const { user } = req;
    return this.paymentLinkService.withdrawPaymentLinkFundsByAdmin(dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("get-tron-balance")
  getPaymentLinkTronTokenBalance(
    @Request() req,
    @Body() dto: GetPaymentLinkTronBalance
  ) {
    const { user } = req;
    return this.paymentLinkService.getPaymentLinkTronTokenBalance(dto, user);
  }
}
