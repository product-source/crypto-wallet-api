import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { MerchantAppTxService } from "./merchant-app-tx.service";
import {
  AddTransactionDto,
  adminFiatTransferDto,
  CryptoTransaction,
  WithdrawFiat,
} from "./dto/merchant-app-tx.dto";
import { plainToClass } from "class-transformer";
import { validateOrReject } from "class-validator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { FileInterceptor } from "@nestjs/platform-express";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { Permissions } from "src/auth/decorators/permissions.decorator";
import { Permission } from "src/auth/enums/role.enum";

@Controller("merchant-app-tx")
export class MerchantAppTxController {
  constructor(private readonly merchantAppTxService: MerchantAppTxService) { }

  @UseGuards(JwtAuthGuard)
  @Get("generate")
  async generatePdf(): Promise<any> {
    try {
      const data = {
        invoice_no: "vishal",
        date: "12-10-2015",
        merchant_id: "merchant_id 985",
        merchant_name: "rahul merchant",
        sender_address: "sender address",
        receiver_address: "receiver address",
        app_id: "TestApp",
        app_name: "app_name",
        email: "email",
        chainId: "chainId",
        hash: "0x..kjasjdfasjdfsa",
        value: "85",
        platform_fee: "5.25",
        adminCharges: "5.2",
        token_name: "USDT",
        withdrawAmount: "9.5",
      };

      // Call the service to generate the PDF
      const fullPath = await this.merchantAppTxService.generatePdf(data);
      console.log("Generated PDF file: ", fullPath);

      // Return the path of the stored file as JSON
      return fullPath;
    } catch (error) {
      console.error("Error generating PDF:", error.message);
      throw new Error("Error generating PDF");
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("add")
  @UseInterceptors(FileInterceptor("file"))
  async addTransaction(
    @Request() req,
    @Body() dto: any, // Initially use `any` to capture raw data
    @UploadedFile() file: Express.Multer.File
  ) {
    const { user } = req;

    // Convert raw `dto` object into an instance of `AddTransactionDto`
    const addTransactionDto = plainToClass(AddTransactionDto, dto);

    // Validate the DTO instance
    await validateOrReject(addTransactionDto);

    if (file) {
      const profilePicUrl = await this.merchantAppTxService.uploadFile(file);
      addTransactionDto.file = profilePicUrl;
    }

    // Now pass the correctly instantiated DTO to the service
    return this.merchantAppTxService.addTransaction(
      user,
      addTransactionDto,
      file
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("merchant-tx-list")
  getMerchantTxList(@Query() query, @Request() req) {
    const { user } = req;
    return this.merchantAppTxService.getMerchatAppsAllTx(query, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get("tx-list")
  getTxList(@Query() query) {
    return this.merchantAppTxService.getAppTx(query);
  }

  // Get App Id all the transaction including payment link and app wallet transaction
  @Get("get-appid-transaction")
  getAppIdTxList(@Query() query) {
    return this.merchantAppTxService.getAppIdTxList(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post("merchant-withdraw")
  merchantWithdraw(@Request() req, @Body() dto: CryptoTransaction) {
    const { user } = req;
    return this.merchantAppTxService.merchantWithdraw(user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("merchant-fiat-withdraw")
  merchantFiatWithdraw(@Request() req, @Body() dto: WithdrawFiat) {
    const { user } = req;
    console.log("USERR ", user);
    return this.merchantAppTxService.merchantWithdrawFiat(user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("merchant-fiat-withdraw-list")
  merchantFiatWithdrawList(@Request() req, @Query() query) {
    const { user } = req;
    return this.merchantAppTxService.getmerchantWithdrawFiatTxList(user, query);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.FIAT_TRANSACTIONS)
  @Get("merchant-fiat-withdraw-list-admin")
  merchantFiatWithdrawListinAdmin(@Request() req, @Query() query) {
    const { user } = req;
    return this.merchantAppTxService.getmerchantWithdrawFiatTxListinAdmin(
      user,
      query
    );
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.FIAT_TRANSACTIONS)
  @Post("admin-fiat-transfer")
  adminFiatTransfer(
    @Request() req,
    @Query() query,
    @Body() dto: adminFiatTransferDto
  ) {
    const { user } = req;
    return this.merchantAppTxService.adminFiatTransfer(query, dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.FIAT_TRANSACTIONS)
  @Get("view-fiat-withdrawl")
  viewFiatWithdrawl(@Request() req, @Query() query) {
    const { user } = req;
    return this.merchantAppTxService.viewFiatTransactionById(query);
  }

  // @Get("get-all-transaction")
  // getAllTxList(@Query() query) {
  //   return this.merchantAppTxService.getAllTxList(query);
  // }

  // @Get("get-wallet-history")
  // getEVMWalletHistory(@Query() query) {
  //   // const { user } = req;
  //   return this.merchantAppTxService.getEVMWalletHistory(query);
  // }
}
