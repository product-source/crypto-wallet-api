import {
  BTC_CHAIN_ID,
  EVM_CHAIN_ID_LIST,
  TRON_CHAIN_ID,
} from "./../constants/index";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  MerchantAppTx,
  MerchantAppTxDocument,
} from "./schema/merchant-app-tx.schema";
import { Model } from "mongoose";
import {
  AddTransactionDto,
  adminFiatTransferDto,
  CryptoTransaction,
  WithdrawFiat,
} from "./dto/merchant-app-tx.dto";
import { Apps, AppsDocument } from "src/apps/schema/apps.schema";
import {
  PaymentLink,
  PaymentLinkDocument,
} from "src/payment-link/schema/payment-link.schema";
import moment from "moment";
import { EmailService } from "src/emails/email.service";
import path, { join } from "path";
import { AdminService } from "src/admin/admin.service";
import {
  PaymentStatus,
  WithdrawlFiatPaymentStatus,
} from "src/payment-link/schema/payment.enum";
import { TokenService } from "src/token/token.service";
import {
  formatDate,
  formatNumber,
  generateInvoiceNumber,
  isValidWalletAddress,
  trimAddress,
  txExplorer,
} from "src/helpers/helper";
import { merchantEvmFundWithdraw } from "src/helpers/evm.helper";
import { EncryptionService } from "src/utils/encryption.service";
import puppeteer from "puppeteer";
import { Merchant } from "src/merchants/schema/merchant.schema";
import { merchantBtcFundWithdraw } from "src/helpers/bitcoin.helper";
import { merchantTronFundWithdraw } from "src/helpers/tron.helper";
import { TransactionTypes } from "./schema/enum";
import {
  FiatWithdraw,
  FiatWithdrawDocument,
} from "./schema/fiat-withdraw.schema";
const fs = require("fs");

@Injectable()
export class MerchantAppTxService {
  constructor(
    @InjectModel(Apps.name)
    private readonly appsModel: Model<AppsDocument>,
    @InjectModel(MerchantAppTx.name)
    private readonly merchantTxModel: Model<MerchantAppTxDocument>,
    @InjectModel(Merchant.name)
    private readonly merchantModel: Model<Merchant>,
    @InjectModel(PaymentLink.name)
    private readonly paymentLinkModel: Model<PaymentLinkDocument>,

    @InjectModel(FiatWithdraw.name)
    private readonly fiatWithdrawModel: Model<FiatWithdrawDocument>,

    private readonly emailService: EmailService,
    private readonly adminService: AdminService,
    private readonly tokenService: TokenService,
    private encryptionService: EncryptionService
  ) {}

  async uploadFile(file: Express.Multer.File): Promise<string> {
    // Use process.cwd() to get the root directory of the project
    const uploadFolder = join(process.cwd(), "uploads");
    console.log("uploadFolder", uploadFolder);

    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
    }

    const timestamp = Date.now();
    const fileExtension = file.originalname.split(".").pop();
    const fileName = `${timestamp}.${fileExtension}`;

    const filePath = join(uploadFolder, fileName);

    fs.writeFileSync(filePath, file.buffer);

    return `/uploads/${fileName}`;
  }

  async addTransaction(
    user: any,
    dto: AddTransactionDto,
    file: Express.Multer.File
  ) {
    try {
      const {
        appsId,
        amount,
        toAddress,
        fromAddress,
        note,
        gas,
        gasPrice,
        hash,
        blockNumber,
        symbol,
        chainId,
        file: fileUrl,
        invoice,
        adminFee,
        adminFeeWallet,
        adminFeeTxHash,
      } = dto;

      const model = new this.merchantTxModel();
      model.appsId = appsId;
      model.recivedAmount = amount;
      model.toAddress = toAddress;
      model.fromAddress = fromAddress;
      model.note = note;
      model.gas = gas;
      model.gasPrice = gasPrice;
      model.hash = hash;
      model.blockNumber = blockNumber;
      model.symbol = symbol;
      model.chainId = chainId;
      model.invoice = invoice;
      model.adminFee = adminFee;
      model.adminFeeWallet = adminFeeWallet;
      model.adminFeeTxHash = adminFeeTxHash;

      if (fileUrl) {
        model.file = fileUrl;
      }
      model.status = PaymentStatus.SUCCESS;

      await model.save();

      if (file) {
        const email = user.email;
        // const email = "rahul.saini@devtechnosys.info";

        // Ensure the file path is absolute
        const absoluteFilePath = join(process.cwd(), fileUrl);

        try {
          await this.emailService.sendEmailWithAttachments(
            email,
            "Withdrawal Invoice",
            "Please find attached your invoice for the recent transaction.",
            file.originalname,
            absoluteFilePath // Use the absolute path here
          );
          console.log("Email sent successfully!");
        } catch (error) {
          console.error("Error sending email:", error);
          throw new BadRequestException("Failed to send email.");
        }
      }

      return { status: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error.message);
      }
    }
  }

  async getMerchatAppsAllTx(query, user) {
    try {
      const {
        appId,
        pageNo,
        limitVal,
        search,
        startDate,
        endDate,
        isInvoiceOnly,
        chainId,
      } = query;

      // Find all apps associated with the given merchant
      const apps = await this.appsModel.find({
        merchantId: user.userId,
      });
      if (apps.length === 0) {
        throw new NotFoundException("Apps not found.");
      }

      // Collect all app IDs
      const appIds = apps.map((app) => app._id);

      const page = pageNo ? parseInt(pageNo) : 1;
      const limit = limitVal ? parseInt(limitVal) : 10;

      let queryObject: any = {};

      if (appId) {
        queryObject.appsId = appId;
      } else {
        queryObject.appsId = { $in: appIds };
      }

      if (search) {
        queryObject = {
          $or: [
            { toAddress: { $regex: search, $options: "i" } },
            { hash: { $regex: search, $options: "i" } },
            { fromAddress: { $regex: search, $options: "i" } },
          ],
        };
      } else if (chainId === "ALL") {
        queryObject = {
          appsId: { $in: appIds },
        };
      } else if (chainId) {
        queryObject = {
          chainId: { $regex: chainId, $options: "i" },
          appsId: { $in: appIds },
        };
      }

      // Merge the `appsId` filter with the existing `queryObject`
      // queryObject.appsId = { $in: appIds };

      // Apply date range filter if provided
      if (startDate || endDate) {
        queryObject.createdAt = {};
        if (startDate) {
          queryObject.createdAt.$gte = moment(startDate)
            .startOf("day")
            .toDate();
        }
        if (endDate) {
          queryObject.createdAt.$lte = moment(endDate).endOf("day").toDate();
        }
      }

      // Add the condition to ensure `invoice` is present and not null/empty
      if (isInvoiceOnly) {
        queryObject.invoice = { $exists: true, $ne: "" };
      }

      const transactions = await this.merchantTxModel
        .find(queryObject)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });

      const count = await this.merchantTxModel.countDocuments(queryObject);
      const totalPages = Math.ceil(count / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        total: count,
        totalPages: totalPages,
        currentPage: page,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
        data: transactions,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async getAppTx(query) {
    try {
      const { pageNo, limitVal, search } = query;

      const page = pageNo ? parseInt(pageNo) : 1;
      const limit = limitVal ? parseInt(limitVal) : 10;

      let queryObject = {};
      if (search) {
        queryObject = {
          $or: [
            { recivedAmount: search },
            { toAddress: { $regex: search, $options: "i" } },
            // { appsId: search },
            { hash: { $regex: search, $options: "i" } },
            { fromAddress: { $regex: search, $options: "i" } },
            { chainId: { $regex: search, $options: "i" } },
            { status: { $regex: search, $options: "i" } },
          ],
        };
      }

      const transactions = await this.merchantTxModel
        .find(queryObject)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });

      const count = await this.merchantTxModel.countDocuments(queryObject);
      const totalPages = Math.ceil(count / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        total: count,
        totalPages: totalPages,
        currentPage: page,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
        data: transactions,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async getAppIdTxList(query) {
    try {
      const { appId, pageNo, limitVal, search } = query;

      if (!appId) {
        throw new BadRequestException("Invalid appId");
      }

      const page = pageNo ? parseInt(pageNo, 10) : 1;
      const limit = limitVal ? parseInt(limitVal, 10) : 10;

      let queryObject1: any = { appsId: appId };

      if (search) {
        queryObject1.$or = [
          { toAddress: { $regex: search, $options: "i" } },
          { hash: { $regex: search, $options: "i" } },
          { fromAddress: { $regex: search, $options: "i" } },
        ];
      }

      let queryObject2: any = { appId: appId };

      if (search) {
        queryObject2.$or = [
          { toAddress: { $regex: search, $options: "i" } },
          { hash: { $regex: search, $options: "i" } },
          { fromAddress: { $regex: search, $options: "i" } },
        ];
      }

      // Fetch data from both models
      const [transactions, paymentLinkTransactions] = await Promise.all([
        this.merchantTxModel.find(queryObject1),
        this.paymentLinkModel.find(queryObject2),
      ]);

      // Merge, sort, and paginate the transactions
      const mergedTransactions = [
        ...transactions,
        ...paymentLinkTransactions,
      ].sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());

      const totalTransactions = mergedTransactions.length;
      const paginatedTransactions = mergedTransactions.slice(
        (page - 1) * limit,
        page * limit
      );

      const totalPages = Math.ceil(totalTransactions / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        total: totalTransactions,
        totalPages,
        currentPage: page,
        hasNextPage,
        hasPrevPage,
        data: paginatedTransactions,
      };
    } catch (error) {
      console.log("An error occurred:", error.message);
      throw new BadRequestException(
        "An error occurred while retrieving transactions."
      );
    }
  }

  async updateInMerchantTxTable(dto: AddTransactionDto) {
    try {
      const {
        appsId,
        amount,
        toAddress,
        fromAddress,
        note,
        gas,
        gasPrice,
        hash,
        blockNumber,
        symbol,
        chainId,
        file,
        invoice,
        adminFee,
        adminFeeWallet,
        adminFeeTxHash,
      } = dto;

      const model = new this.merchantTxModel();
      model.appsId = appsId;
      model.recivedAmount = amount;
      model.toAddress = toAddress;
      model.fromAddress = fromAddress;
      model.note = note;
      model.gas = gas;
      model.gasPrice = gasPrice;
      model.hash = hash;
      model.blockNumber = blockNumber;
      model.symbol = symbol;
      model.chainId = chainId;
      model.invoice = invoice;
      model.adminFee = adminFee;
      model.adminFeeWallet = adminFeeWallet;
      model.adminFeeTxHash = adminFeeTxHash;
      model.file = file;
      model.txType = TransactionTypes.WITHDRAW;
      model.status = PaymentStatus.SUCCESS;

      await model.save();

      return {
        status: true,
      };
    } catch (error) {
      return {
        status: false,
        message: error.message,
      };
    }
  }

  async getFee(token, amount) {
    // get token info
    let adminFee;
    let MFIP;
    let WA;
    let AWA;
    let AC;
    try {
      adminFee = await this.adminService.getPlatformFee();
      adminFee = adminFee.data;
    } catch (error) {
      throw new BadRequestException("Invalid tokenId");
    }
    if (token?.chainId == TRON_CHAIN_ID) {
      MFIP = adminFee?.tronMerchantFee;
      WA = parseFloat(amount) / (1 + adminFee?.tronMerchantFee / 100);
      AWA = adminFee?.tronAdminWallet;
    } else if (token?.chainId == BTC_CHAIN_ID) {
      MFIP = adminFee?.btcMerchantFee;
      WA = parseFloat(amount) / (1 + adminFee?.btcMerchantFee / 100);
      AWA = adminFee?.btcAdminWallet;
    } else if (EVM_CHAIN_ID_LIST.includes(token?.chainId)) {
      MFIP = adminFee?.merchantFee;
      WA = parseFloat(amount) / (1 + adminFee?.merchantFee / 100);
      AWA = adminFee?.adminWallet;
    } else {
      console.log("Invalid chianId from get fee");

      throw new BadRequestException(
        `Unsupported chain id ${token.chainId} for withdrawal`
      );
    }
    AC = parseFloat(amount) - WA;

    return {
      MFIP,
      WA,
      AWA,
      AC,
    };
  }

  async merchantWithdraw(user: any, dto: CryptoTransaction) {
    try {
      const {
        appsId,
        tokenId,
        amount,
        withdrawalAddress,
        isWithTax,
        swapTokenAddress,
        note,
      } = dto;

      let withdrawalAmount = 0;
      let adminCharges = 0;
      let adminWalletAddress;
      let merchantFeeInPercent = 0;
      let invoiceNumber = await generateInvoiceNumber();

      // get app info
      const app = await this.appsModel.findOne({
        _id: appsId,
        merchantId: user?.userId,
      });

      if (!app) {
        throw new BadRequestException("Invalid appsId");
      }

      // get token info
      let token;
      try {
        token = await this.tokenService.tokenById({ tokenId });
        token = token.data;
      } catch (error) {
        throw new BadRequestException("Invalid tokenId");
      }

      if (swapTokenAddress) {
        const isValidAddress = await isValidWalletAddress(
          swapTokenAddress,
          token.chainId
        );

        if (!isValidAddress) {
          throw new BadRequestException(
            `Invalid swap token address for chain id ${token.chainId}`
          );
        }
      }

      if (amount < token.minWithdraw) {
        throw new BadRequestException(
          `Amount should be greater than or equal to minimum withdrawal amount ${token.minWithdraw}`
        );
      }

      // Set the tax data
      if (isWithTax) {
        // Rahul Saini
        const { MFIP, WA, AWA, AC } = await this.getFee(token, amount);
        merchantFeeInPercent = MFIP;
        withdrawalAmount = WA;
        adminWalletAddress = AWA;
        adminCharges = AC;
      } else {
        withdrawalAmount = parseFloat(amount);
      }

      const isValidAddress = await isValidWalletAddress(
        withdrawalAddress,
        token.chainId
      );

      if (!isValidAddress) {
        throw new BadRequestException(
          `Invalid withdrawal address for chain id ${token.chainId}`
        );
      }

      let merchantReceipt = null;
      let adminReceipt = null;
      let WALLET = null;

      // Transaction or withdraw fund
      if (token.chainId === BTC_CHAIN_ID) {
        // TODO: Implement BTC withdrawal logic
        WALLET = app.BtcWalletMnemonic;

        const decryptedPrivateKey = this.encryptionService.decryptData(
          WALLET?.privateKey
        );

        const fromAddress = WALLET?.address;

        // Withdraw Merchant Amount
        merchantReceipt = await merchantBtcFundWithdraw(
          decryptedPrivateKey,
          Number(withdrawalAmount.toFixed(token.decimal)),
          withdrawalAddress,
          fromAddress,
          Number(adminCharges.toFixed(token.decimal)),
          adminWalletAddress
        );

        adminReceipt = merchantReceipt;

        if (merchantReceipt.status === false) {
          throw new BadRequestException(
            merchantReceipt?.error || "Unable to withdraw funds"
          );
        }
      } else if (token.chainId === TRON_CHAIN_ID) {
        // TODO: Implement TRON withdrawal logic
        WALLET = app.TronWalletMnemonic;

        const decryptedPrivateKey = this.encryptionService.decryptData(
          WALLET?.privateKey
        );

        // Withdraw Merchant Amount
        merchantReceipt = await merchantTronFundWithdraw(
          decryptedPrivateKey,
          token.address,
          withdrawalAmount.toFixed(token.decimal),
          withdrawalAddress,
          token.decimal
        );

        if (merchantReceipt.status === false) {
          throw new BadRequestException(
            merchantReceipt?.error || "Unable to withdraw funds"
          );
        }

        // Withdraw Admin Amount
        if (adminCharges > 0) {
          adminReceipt = await merchantTronFundWithdraw(
            decryptedPrivateKey,
            token.address,
            adminCharges.toFixed(token.decimal),
            adminWalletAddress,
            token.decimal
          );
        }
      } else if (EVM_CHAIN_ID_LIST.includes(token.chainId)) {
        // TODO: Implement default withdrawal logic for other chains
        WALLET = app.EVMWalletMnemonic;

        const decryptedPrivateKey = this.encryptionService.decryptData(
          WALLET?.privateKey
        );

        // Withdraw Merchant Amount
        merchantReceipt = await merchantEvmFundWithdraw(
          token.chainId,
          decryptedPrivateKey,
          token.address,
          withdrawalAmount.toFixed(token.decimal),
          withdrawalAddress,
          token.decimal,
          swapTokenAddress
        );

        if (merchantReceipt.status === false) {
          throw new BadRequestException(
            merchantReceipt?.error || "Unable to withdraw funds"
          );
        }

        // Withdraw Admin Amount
        if (adminCharges > 0) {
          adminReceipt = await merchantEvmFundWithdraw(
            token.chainId,
            decryptedPrivateKey,
            token.address,
            adminCharges.toFixed(token.decimal),
            adminWalletAddress,
            token.decimal,
            null
          );
        }
      } else {
        throw new BadRequestException(
          `Unsupported chain id ${token.chainId} for withdrawal`
        );
      }

      const merchant = await this.merchantModel.findById(app?.merchantId);

      let filePath = null;
      const txExplorerUrl = await txExplorer(
        token.chainId,
        merchantReceipt?.data?.transactionHash
      );
      console.log("txExplorerUrl is : ", txExplorerUrl);

      // Login to generate PDF file
      try {
        const data = {
          invoice_no: invoiceNumber,
          date: formatDate(Date.now()),
          merchant_id: app?.merchantId,
          merchant_name: merchant ? merchant?.name : "MERCHANT-NAME",
          sender_address: trimAddress(WALLET.address, 5, 8),
          receiver_address: trimAddress(withdrawalAddress, 5, 8),
          app_id: app._id,
          app_name: app.name,
          email: merchant?.email,
          chainId: token.chainId,
          hash: trimAddress(merchantReceipt?.data?.transactionHash, 5, 8),
          value: formatNumber(withdrawalAmount, 8),
          platform_fee: formatNumber(merchantFeeInPercent, 2),
          adminCharges: formatNumber(adminCharges, 8),
          token_name: token.symbol,
          withdrawAmount: formatNumber(withdrawalAmount, 8),
          totalAmount: amount,
          explorerURL: txExplorerUrl,
        };
        // Call the service to generate the PDF
        filePath = await this.generatePdf(data);
        // { a: filePath, b: relativePath }
      } catch (error) {
        console.log("Failed to generate PDF : ", error.message);
      }

      // Save transaction data to the database
      try {
        const response = await this.updateInMerchantTxTable({
          appsId,
          amount: withdrawalAmount.toString(),
          toAddress: withdrawalAddress,
          fromAddress: WALLET.address,
          note,
          gas: merchantReceipt?.data?.gasUsed,
          gasPrice: merchantReceipt?.data?.effectiveGasPrice,
          hash: merchantReceipt?.data?.transactionHash,
          blockNumber: merchantReceipt?.data?.blockNumber,
          symbol: token.symbol,
          chainId: token.chainId,
          file: filePath?.relativePath,
          invoice: invoiceNumber,
          adminFee: adminCharges.toString(),
          adminFeeWallet: adminWalletAddress,
          adminFeeTxHash: adminReceipt?.data?.transactionHash,
        });

        if (response?.status == false) {
          throw new BadRequestException(
            response?.message || "Unable to save the transaction"
          );
        }
      } catch (error) {
        console.log(
          "Failed to save transaction to the database : ",
          error.message
        );
      }

      const EMAIL_TEMPLATE_FOR_MERCHANT_WITHDRAW = `<!DOCTYPE html>
      <html>

      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Withdrawal Invoice</title>
      </head>

      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background-color: #f9f9f9; padding: 20px; text-align: center;">
          <tr>
            <td>
              <!-- Email Container -->
              <table width="600" cellpadding="0" cellspacing="0"
                style="margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <!-- Header Section -->
                <tr>
                  <td style="padding: 20px; background: #fff; text-align: center; border-bottom: 1px solid #e0e0e0;">
                    <img src="https://crypto-wallet-api.devtechnosys.tech/logo/logo.png" width="200"
                      style="max-width: 100%; height: auto;" />
                  </td>
                </tr>
                <!-- Title Section -->
                <tr>
                  <td style="padding: 20px; text-align: center; color: #333;">
                    <h2 style="margin: 0 0 10px; font-size: 24px; color: #000;">
                      Withdrawal Invoice
                    </h2>
                    <p style="margin: 0; font-size: 16px;">
                      Thank you for your transaction. Below are the details of your withdrawal:
                    </p>
                  </td>
                </tr>
                <!-- Invoice Details Section -->
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="border-collapse: collapse; background: #f9f9f9;">
                      <tr>
                        <td style="
                              padding: 10px;
                              font-weight: bold;
                              text-align: left;
                              border-bottom: 1px solid #ddd;
                              color: #333;
                            ">
                          Transaction ID:
                        </td>
                        <td style="
                              padding: 10px;
                              text-align: right;
                              border-bottom: 1px solid #ddd;
                              color: #555;
                            ">
                            ${trimAddress(merchantReceipt?.data?.transactionHash, 6, 6)}
                        </td>
                      </tr>
                      <tr>
                        <td style="
                              padding: 10px;
                              font-weight: bold;
                              text-align: left;
                              border-bottom: 1px solid #ddd;
                              color: #333;
                            ">
                          Date:
                        </td>
                        <td style="
                              padding: 10px;
                              text-align: right;
                              border-bottom: 1px solid #ddd;
                              color: #555;
                            ">
                          ${formatDate(Date.now())}
                        </td>
                      </tr>
                      <tr>
                        <td style="
                              padding: 10px;
                              font-weight: bold;
                              text-align: left;
                              border-bottom: 1px solid #ddd;
                              color: #333;
                            ">
                          Amount Withdrawn:
                        </td>
                        <td style="
                              padding: 10px;
                              text-align: right;
                              border-bottom: 1px solid #ddd;
                              color: #555;
                            ">
                          ${formatNumber(withdrawalAmount.toString(), 8)} ${" "} ${token.symbol}
                        </td>
                      </tr>
                      <tr>
                        <td style="
                              padding: 10px;
                              font-weight: bold;
                              text-align: left;
                              color: #333;
                            ">
                          Account Ending:
                        </td>
                        <td style="
                              padding: 10px;
                              text-align: right;
                              color: #555;
                            ">
                          ${trimAddress(withdrawalAddress, 5, 8)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Footer Section -->
                <tr>
                  <td style="
                        padding: 20px;
                        font-size: 14px;
                        text-align: center;
                        color: #666;
                      ">
                    If you have any questions, feel free to contact us at
                    <a href="mailto:newsletter@coinpera.com"
                      style="color: #000; text-decoration: mailto:none;">newsletter@coinpera.com</a>.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 20px 20px; text-align: center;">
                    <p style="margin: 0; color: #999;">
                      © ${new Date().getFullYear()} Coinpera. All rights reserved.
                    </p>
                    <p style="margin: 5px 0 0; color: #999;">
                      Tbilisi, 0144 Tbilisi ,Georgia
                    </p>
                    <p style="margin: 5px 0 0; color: #999;">
                      <a href="https://crypto-wallet.devtechnosys.tech"
                        style="color: #000; text-decoration: none;">Coinpera</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>

      </html>`;

      // Logic to send email notification
      try {
        // Send the email with the generated PDF as an attachment
        await this.emailService.sendEmailWithAttachments(
          merchant?.email,
          "Withdrawal Invoice", // Email subject
          EMAIL_TEMPLATE_FOR_MERCHANT_WITHDRAW, // Email body
          "Invoice.pdf", // Attach the PDF file with original filename
          filePath?.fullPath // Absolute file path
        );
        console.log("Email sent successfully!");
      } catch (error) {
        console.log("Error sending email:", error);
        return { message: "Failed to send email", status: false };
      }

      return {
        merchantReceipt,
        adminReceipt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error.message);
      }
    }
  }

  async merchantWithdrawFiat(user: any, dto: WithdrawFiat) {
    try {
      const {
        appsId,
        totalFiatBalance,
        minimumWithdrawl,
        withdrawlAmount,
        currency,
        cryptoValue,
        walletAddress,
        note,
      } = dto;

      const model = new this.fiatWithdrawModel();
      model.merchantId = user?.userId;
      model.appsId = appsId;
      model.totalFiatBalance = totalFiatBalance;
      model.minimumWithdrawl = minimumWithdrawl;
      model.withdrawlAmount = withdrawlAmount;
      model.currency = currency;
      model.cryptoValue = cryptoValue;
      model.walletAddress = walletAddress;
      model.note = note;

      await model.save();

      return {
        success: true,
        message: "Withdrawl Request Sent Successfully",
        model,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error.message);
      }
    }
  }

  async getmerchantWithdrawFiatTxList(user, query) {
    try {
      const { pageNo, limitVal } = query;

      const page = pageNo ? parseInt(pageNo, 10) : 1;
      const limit = limitVal ? parseInt(limitVal, 10) : 10;

      const merchantId = user?.userId;

      // Total count
      const totalCount = await this.fiatWithdrawModel.countDocuments({
        merchantId,
      });

      // Pagination skip
      const skip = (page - 1) * limit;

      // Paginated data
      const transactions = await this.fiatWithdrawModel
        .find({ merchantId })
        .populate({
          path: "appsId",
          select: "name totalFiatBalance",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        totalCount,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        data: transactions,
      };
    } catch (error) {
      console.log("An error occurred:", error.message);
      throw new BadRequestException(
        "An error occurred while retrieving transactions."
      );
    }
  }

  async generatePdf(data): Promise<object> {
    const fileName = `${Date.now()}.pdf`;
    const folderName = "uploads";
    const templatePath = join(process.cwd(), "src/templates", "Invoice.html");
    const uploadFolder = join(process.cwd(), folderName);
    const fullPath = path.join(uploadFolder, fileName);

    const relativePath = `/${folderName}/${fileName}`;

    // Ensure upload folder exists
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder);
    }

    // Read the HTML template
    let html = fs.readFileSync(templatePath, "utf-8");

    // Replace the name dynamically
    html = html
      .replace(/{{invoice_no}}/g, data.invoice_no)
      .replace(/{{date}}/g, data.date)
      .replace(/{{merchant_id}}/g, data.merchant_id)
      .replace(/{{merchant_name}}/g, data.merchant_name)
      .replace(/{{sender_address}}/g, data.sender_address)
      .replace(/{{receiver_address}}/g, data.receiver_address)
      .replace(/{{app_id}}/g, data.app_id)
      .replace(/{{app_name}}/g, data.app_name)
      .replace(/{{email}}/g, data.email)
      .replace(/{{token_name}}/g, data.token_name)
      .replace(/{{chainId}}/g, data.chainId)
      .replace(/{{hash}}/g, data.hash)
      .replace(/{{value}}/g, data.value)
      .replace(/{{platform_fee}}/g, data.platform_fee)
      .replace(/{{adminCharges}}/g, data.adminCharges)
      .replace(/{{withdrawAmount}}/g, data.withdrawAmount)
      .replace(/{{totalAmount}}/g, data.totalAmount)
      .replace(/{{explorerURL}}/g, data?.explorerURL);

    const isProduction = process.env.NODE_ENV === "production";

    console.log("Production mode enabled : ", isProduction);

    // Launch Puppeteer and generate the PDF
    let browser = null;
    if (isProduction) {
      browser = await puppeteer.launch({
        executablePath: "/usr/bin/chromium-browser", // Specify the Chromium executable path
        headless: true, // Ensure it's in headless mode
        args: ["--no-sandbox", "--disable-setuid-sandbox"], // Run with no sandbox
      });
    } else {
      browser = await puppeteer.launch();
    }

    const page = await browser.newPage();
    await page.setContent(html);
    await page.pdf({ path: fullPath, format: "A4" });

    await browser.close();

    return { fullPath, relativePath }; // Return the file path for further use
  }

  async getmerchantWithdrawFiatTxListinAdmin(user, query) {
    try {
      const { pageNo, limitVal } = query;

      const page = pageNo ? parseInt(pageNo, 10) : 1;

      const limit = limitVal ? parseInt(limitVal, 10) : 10;

      // Total count
      const totalCount = await this.fiatWithdrawModel.countDocuments();

      // Pagination skip
      const skip = (page - 1) * limit;

      // Paginated data
      const transactions = await this.fiatWithdrawModel
        .find()
        .populate({
          path: "merchantId",
          select: "name countryCode contactNumber email",
        })
        .populate({
          path: "appsId",
          select: "name totalFiatBalance",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        totalCount,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        data: transactions,
      };
    } catch (error) {
      console.log("An error occurred:", error.message);
      throw new BadRequestException(
        "An error occurred while retrieving transactions."
      );
    }
  }

  async adminFiatTransfer(query, dto: adminFiatTransferDto) {
    try {
      const { fiatWithdrawId, txHash } = dto;

      const withdrawData =
        await this.fiatWithdrawModel.findById(fiatWithdrawId);
      if (!withdrawData) {
        throw new BadRequestException("Invalid withdrawl Id");
      }
      const appInfo = await this.appsModel.findOne({
        _id: withdrawData?.appsId,
      });
      if (!appInfo) {
        throw new BadRequestException("app not found");
      }

      const deductionAmount = Number(withdrawData.withdrawlAmount);

      if (appInfo.totalFiatBalance < deductionAmount) {
        throw new BadRequestException(
          "Insufficient fiat balance to process withdrawal"
        );
      }

      const updatedBalance =
        Number(appInfo.totalFiatBalance) - Number(deductionAmount);

      const updatedApp = await this.appsModel.findByIdAndUpdate(
        appInfo._id,
        {
          totalFiatBalance: updatedBalance,
        },
        { new: true }
      );

      const updatedWithdraw = await this.fiatWithdrawModel.findByIdAndUpdate(
        fiatWithdrawId,
        {
          status: WithdrawlFiatPaymentStatus.SUCCESS,
          transferDate: new Date(),
          txHash: txHash,
        },
        { new: true }
      );

      return {
        success: true,
        data: "Fiat transfer successfully",
        withdrawData: updatedWithdraw,
        appInfo: updatedApp,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async viewFiatTransactionById(query) {
    try {
      const { fiatWithdrawId } = query;

      if (!fiatWithdrawId) {
        throw new BadRequestException("Fiat withdrwal Id is required");
      }

      const fiatData = await this.fiatWithdrawModel
        .findById(fiatWithdrawId)
        .populate({
          path: "appsId",
          select: "name totalFiatBalance", // whatever fields you want
        })
        .populate({
          path: "merchantId",
          select: "name email countryCode contactNumber", // choose fields you need
        });

      if (!fiatData) {
        throw new BadRequestException("Invalid fiat withdrwal Id");
      }

      return { success: true, message: "Fiat withdrawl data", fiatData };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }
}
