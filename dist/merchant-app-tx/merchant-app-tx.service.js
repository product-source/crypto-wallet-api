"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantAppTxService = void 0;
const index_1 = require("./../constants/index");
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const merchant_app_tx_schema_1 = require("./schema/merchant-app-tx.schema");
const mongoose_2 = require("mongoose");
const apps_schema_1 = require("../apps/schema/apps.schema");
const payment_link_schema_1 = require("../payment-link/schema/payment-link.schema");
const moment_1 = __importDefault(require("moment"));
const email_service_1 = require("../emails/email.service");
const path_1 = __importStar(require("path"));
const admin_service_1 = require("../admin/admin.service");
const payment_enum_1 = require("../payment-link/schema/payment.enum");
const token_service_1 = require("../token/token.service");
const helper_1 = require("../helpers/helper");
const evm_helper_1 = require("../helpers/evm.helper");
const encryption_service_1 = require("../utils/encryption.service");
const puppeteer_1 = __importDefault(require("puppeteer"));
const merchant_schema_1 = require("../merchants/schema/merchant.schema");
const bitcoin_helper_1 = require("../helpers/bitcoin.helper");
const tron_helper_1 = require("../helpers/tron.helper");
const enum_1 = require("./schema/enum");
const fiat_withdraw_schema_1 = require("./schema/fiat-withdraw.schema");
const fs = require("fs");
let MerchantAppTxService = class MerchantAppTxService {
    constructor(appsModel, merchantTxModel, merchantModel, paymentLinkModel, fiatWithdrawModel, emailService, adminService, tokenService, encryptionService) {
        this.appsModel = appsModel;
        this.merchantTxModel = merchantTxModel;
        this.merchantModel = merchantModel;
        this.paymentLinkModel = paymentLinkModel;
        this.fiatWithdrawModel = fiatWithdrawModel;
        this.emailService = emailService;
        this.adminService = adminService;
        this.tokenService = tokenService;
        this.encryptionService = encryptionService;
    }
    async uploadFile(file) {
        const uploadFolder = (0, path_1.join)(process.cwd(), "uploads");
        console.log("uploadFolder", uploadFolder);
        if (!fs.existsSync(uploadFolder)) {
            fs.mkdirSync(uploadFolder, { recursive: true });
        }
        const timestamp = Date.now();
        const fileExtension = file.originalname.split(".").pop();
        const fileName = `${timestamp}.${fileExtension}`;
        const filePath = (0, path_1.join)(uploadFolder, fileName);
        fs.writeFileSync(filePath, file.buffer);
        return `/uploads/${fileName}`;
    }
    async addTransaction(user, dto, file) {
        try {
            const { appsId, amount, toAddress, fromAddress, note, gas, gasPrice, hash, blockNumber, symbol, chainId, file: fileUrl, invoice, adminFee, adminFeeWallet, adminFeeTxHash, } = dto;
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
            model.status = payment_enum_1.PaymentStatus.SUCCESS;
            await model.save();
            if (file) {
                const email = user.email;
                const absoluteFilePath = (0, path_1.join)(process.cwd(), fileUrl);
                try {
                    await this.emailService.sendEmailWithAttachments(email, "Withdrawal Invoice", "Please find attached your invoice for the recent transaction.", file.originalname, absoluteFilePath);
                    console.log("Email sent successfully!");
                }
                catch (error) {
                    console.error("Error sending email:", error);
                    throw new common_1.BadRequestException("Failed to send email.");
                }
            }
            return { status: true };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error.message);
            }
        }
    }
    async getMerchatAppsAllTx(query, user) {
        try {
            const { appId, pageNo, limitVal, search, startDate, endDate, isInvoiceOnly, chainId, } = query;
            const apps = await this.appsModel.find({
                merchantId: user.userId,
            });
            if (apps.length === 0) {
                throw new common_1.NotFoundException("Apps not found.");
            }
            const appIds = apps.map((app) => app._id);
            const page = pageNo ? parseInt(pageNo) : 1;
            const limit = limitVal ? parseInt(limitVal) : 10;
            let queryObject = {};
            if (appId) {
                queryObject.appsId = appId;
            }
            else {
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
            }
            else if (chainId === "ALL") {
                queryObject = {
                    appsId: { $in: appIds },
                };
            }
            else if (chainId) {
                queryObject = {
                    chainId: { $regex: chainId, $options: "i" },
                    appsId: { $in: appIds },
                };
            }
            if (startDate || endDate) {
                queryObject.createdAt = {};
                if (startDate) {
                    queryObject.createdAt.$gte = (0, moment_1.default)(startDate)
                        .startOf("day")
                        .toDate();
                }
                if (endDate) {
                    queryObject.createdAt.$lte = (0, moment_1.default)(endDate).endOf("day").toDate();
                }
            }
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
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error);
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
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error);
            }
        }
    }
    async getAppIdTxList(query) {
        try {
            const { appId, pageNo, limitVal, search } = query;
            if (!appId) {
                throw new common_1.BadRequestException("Invalid appId");
            }
            const page = pageNo ? parseInt(pageNo, 10) : 1;
            const limit = limitVal ? parseInt(limitVal, 10) : 10;
            let queryObject1 = { appsId: appId };
            if (search) {
                queryObject1.$or = [
                    { toAddress: { $regex: search, $options: "i" } },
                    { hash: { $regex: search, $options: "i" } },
                    { fromAddress: { $regex: search, $options: "i" } },
                ];
            }
            let queryObject2 = { appId: appId };
            if (search) {
                queryObject2.$or = [
                    { toAddress: { $regex: search, $options: "i" } },
                    { hash: { $regex: search, $options: "i" } },
                    { fromAddress: { $regex: search, $options: "i" } },
                ];
            }
            const [transactions, paymentLinkTransactions] = await Promise.all([
                this.merchantTxModel.find(queryObject1),
                this.paymentLinkModel.find(queryObject2),
            ]);
            const mergedTransactions = [
                ...transactions,
                ...paymentLinkTransactions,
            ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            const totalTransactions = mergedTransactions.length;
            const paginatedTransactions = mergedTransactions.slice((page - 1) * limit, page * limit);
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
        }
        catch (error) {
            console.log("An error occurred:", error.message);
            throw new common_1.BadRequestException("An error occurred while retrieving transactions.");
        }
    }
    async updateInMerchantTxTable(dto) {
        try {
            const { appsId, amount, toAddress, fromAddress, note, gas, gasPrice, hash, blockNumber, symbol, chainId, file, invoice, adminFee, adminFeeWallet, adminFeeTxHash, } = dto;
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
            model.txType = enum_1.TransactionTypes.WITHDRAW;
            model.status = payment_enum_1.PaymentStatus.SUCCESS;
            await model.save();
            return {
                status: true,
            };
        }
        catch (error) {
            return {
                status: false,
                message: error.message,
            };
        }
    }
    async getFee(token, amount) {
        let adminFee;
        let MFIP;
        let WA;
        let AWA;
        let AC;
        try {
            adminFee = await this.adminService.getPlatformFee();
            adminFee = adminFee.data;
        }
        catch (error) {
            throw new common_1.BadRequestException("Invalid tokenId");
        }
        if (token?.chainId == index_1.TRON_CHAIN_ID) {
            MFIP = adminFee?.tronMerchantFee;
            WA = parseFloat(amount) / (1 + adminFee?.tronMerchantFee / 100);
            AWA = adminFee?.tronAdminWallet;
        }
        else if (token?.chainId == index_1.BTC_CHAIN_ID) {
            MFIP = adminFee?.btcMerchantFee;
            WA = parseFloat(amount) / (1 + adminFee?.btcMerchantFee / 100);
            AWA = adminFee?.btcAdminWallet;
        }
        else if (index_1.EVM_CHAIN_ID_LIST.includes(token?.chainId)) {
            MFIP = adminFee?.merchantFee;
            WA = parseFloat(amount) / (1 + adminFee?.merchantFee / 100);
            AWA = adminFee?.adminWallet;
        }
        else {
            console.log("Invalid chianId from get fee");
            throw new common_1.BadRequestException(`Unsupported chain id ${token.chainId} for withdrawal`);
        }
        AC = parseFloat(amount) - WA;
        return {
            MFIP,
            WA,
            AWA,
            AC,
        };
    }
    async merchantWithdraw(user, dto) {
        try {
            const { appsId, tokenId, amount, withdrawalAddress, isWithTax, swapTokenAddress, note, } = dto;
            let withdrawalAmount = 0;
            let adminCharges = 0;
            let adminWalletAddress;
            let merchantFeeInPercent = 0;
            let invoiceNumber = await (0, helper_1.generateInvoiceNumber)();
            const app = await this.appsModel.findOne({
                _id: appsId,
                merchantId: user?.userId,
            });
            if (!app) {
                throw new common_1.BadRequestException("Invalid appsId");
            }
            let token;
            try {
                token = await this.tokenService.tokenById({ tokenId });
                token = token.data;
            }
            catch (error) {
                throw new common_1.BadRequestException("Invalid tokenId");
            }
            if (swapTokenAddress) {
                const isValidAddress = await (0, helper_1.isValidWalletAddress)(swapTokenAddress, token.chainId);
                if (!isValidAddress) {
                    throw new common_1.BadRequestException(`Invalid swap token address for chain id ${token.chainId}`);
                }
            }
            if (amount < token.minWithdraw) {
                throw new common_1.BadRequestException(`Amount should be greater than or equal to minimum withdrawal amount ${token.minWithdraw}`);
            }
            if (isWithTax) {
                const { MFIP, WA, AWA, AC } = await this.getFee(token, amount);
                merchantFeeInPercent = MFIP;
                withdrawalAmount = WA;
                adminWalletAddress = AWA;
                adminCharges = AC;
            }
            else {
                withdrawalAmount = parseFloat(amount);
            }
            const isValidAddress = await (0, helper_1.isValidWalletAddress)(withdrawalAddress, token.chainId);
            if (!isValidAddress) {
                throw new common_1.BadRequestException(`Invalid withdrawal address for chain id ${token.chainId}`);
            }
            let merchantReceipt = null;
            let adminReceipt = null;
            let WALLET = null;
            if (token.chainId === index_1.BTC_CHAIN_ID) {
                WALLET = app.BtcWalletMnemonic;
                const decryptedPrivateKey = this.encryptionService.decryptData(WALLET?.privateKey);
                const fromAddress = WALLET?.address;
                merchantReceipt = await (0, bitcoin_helper_1.merchantBtcFundWithdraw)(decryptedPrivateKey, Number(withdrawalAmount.toFixed(token.decimal)), withdrawalAddress, fromAddress, Number(adminCharges.toFixed(token.decimal)), adminWalletAddress);
                adminReceipt = merchantReceipt;
                if (merchantReceipt.status === false) {
                    throw new common_1.BadRequestException(merchantReceipt?.error || "Unable to withdraw funds");
                }
            }
            else if (token.chainId === index_1.TRON_CHAIN_ID) {
                WALLET = app.TronWalletMnemonic;
                const decryptedPrivateKey = this.encryptionService.decryptData(WALLET?.privateKey);
                merchantReceipt = await (0, tron_helper_1.merchantTronFundWithdraw)(decryptedPrivateKey, token.address, withdrawalAmount.toFixed(token.decimal), withdrawalAddress, token.decimal);
                if (merchantReceipt.status === false) {
                    throw new common_1.BadRequestException(merchantReceipt?.error || "Unable to withdraw funds");
                }
                if (adminCharges > 0) {
                    adminReceipt = await (0, tron_helper_1.merchantTronFundWithdraw)(decryptedPrivateKey, token.address, adminCharges.toFixed(token.decimal), adminWalletAddress, token.decimal);
                }
            }
            else if (index_1.EVM_CHAIN_ID_LIST.includes(token.chainId)) {
                WALLET = app.EVMWalletMnemonic;
                const decryptedPrivateKey = this.encryptionService.decryptData(WALLET?.privateKey);
                merchantReceipt = await (0, evm_helper_1.merchantEvmFundWithdraw)(token.chainId, decryptedPrivateKey, token.address, withdrawalAmount.toFixed(token.decimal), withdrawalAddress, token.decimal, swapTokenAddress);
                if (merchantReceipt.status === false) {
                    throw new common_1.BadRequestException(merchantReceipt?.error || "Unable to withdraw funds");
                }
                if (adminCharges > 0) {
                    adminReceipt = await (0, evm_helper_1.merchantEvmFundWithdraw)(token.chainId, decryptedPrivateKey, token.address, adminCharges.toFixed(token.decimal), adminWalletAddress, token.decimal, null);
                }
            }
            else {
                throw new common_1.BadRequestException(`Unsupported chain id ${token.chainId} for withdrawal`);
            }
            const merchant = await this.merchantModel.findById(app?.merchantId);
            let filePath = null;
            const txExplorerUrl = await (0, helper_1.txExplorer)(token.chainId, merchantReceipt?.data?.transactionHash);
            console.log("txExplorerUrl is : ", txExplorerUrl);
            try {
                const data = {
                    invoice_no: invoiceNumber,
                    date: (0, helper_1.formatDate)(Date.now()),
                    merchant_id: app?.merchantId,
                    merchant_name: merchant ? merchant?.name : "MERCHANT-NAME",
                    sender_address: (0, helper_1.trimAddress)(WALLET.address, 5, 8),
                    receiver_address: (0, helper_1.trimAddress)(withdrawalAddress, 5, 8),
                    app_id: app._id,
                    app_name: app.name,
                    email: merchant?.email,
                    chainId: token.chainId,
                    hash: (0, helper_1.trimAddress)(merchantReceipt?.data?.transactionHash, 5, 8),
                    value: (0, helper_1.formatNumber)(withdrawalAmount, 8),
                    platform_fee: (0, helper_1.formatNumber)(merchantFeeInPercent, 2),
                    adminCharges: (0, helper_1.formatNumber)(adminCharges, 8),
                    token_name: token.symbol,
                    withdrawAmount: (0, helper_1.formatNumber)(withdrawalAmount, 8),
                    totalAmount: amount,
                    explorerURL: txExplorerUrl,
                };
                filePath = await this.generatePdf(data);
            }
            catch (error) {
                console.log("Failed to generate PDF : ", error.message);
            }
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
                    throw new common_1.BadRequestException(response?.message || "Unable to save the transaction");
                }
            }
            catch (error) {
                console.log("Failed to save transaction to the database : ", error.message);
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
                            ${(0, helper_1.trimAddress)(merchantReceipt?.data?.transactionHash, 6, 6)}
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
                          ${(0, helper_1.formatDate)(Date.now())}
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
                          ${(0, helper_1.formatNumber)(withdrawalAmount.toString(), 8)} ${" "} ${token.symbol}
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
                          ${(0, helper_1.trimAddress)(withdrawalAddress, 5, 8)}
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
            try {
                await this.emailService.sendEmailWithAttachments(merchant?.email, "Withdrawal Invoice", EMAIL_TEMPLATE_FOR_MERCHANT_WITHDRAW, "Invoice.pdf", filePath?.fullPath);
                console.log("Email sent successfully!");
            }
            catch (error) {
                console.log("Error sending email:", error);
                return { message: "Failed to send email", status: false };
            }
            return {
                merchantReceipt,
                adminReceipt,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error.message);
            }
        }
    }
    async merchantWithdrawFiat(user, dto) {
        try {
            const { appsId, totalFiatBalance, minimumWithdrawl, withdrawlAmount, currency, cryptoValue, walletAddress, note, } = dto;
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
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error.message);
            }
        }
    }
    async getmerchantWithdrawFiatTxList(user, query) {
        try {
            const { pageNo, limitVal } = query;
            const page = pageNo ? parseInt(pageNo, 10) : 1;
            const limit = limitVal ? parseInt(limitVal, 10) : 10;
            const merchantId = user?.userId;
            const totalCount = await this.fiatWithdrawModel.countDocuments({
                merchantId,
            });
            const skip = (page - 1) * limit;
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
        }
        catch (error) {
            console.log("An error occurred:", error.message);
            throw new common_1.BadRequestException("An error occurred while retrieving transactions.");
        }
    }
    async generatePdf(data) {
        const fileName = `${Date.now()}.pdf`;
        const folderName = "uploads";
        const templatePath = (0, path_1.join)(process.cwd(), "src/templates", "Invoice.html");
        const uploadFolder = (0, path_1.join)(process.cwd(), folderName);
        const fullPath = path_1.default.join(uploadFolder, fileName);
        const relativePath = `/${folderName}/${fileName}`;
        if (!fs.existsSync(uploadFolder)) {
            fs.mkdirSync(uploadFolder);
        }
        let html = fs.readFileSync(templatePath, "utf-8");
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
        let browser = null;
        if (isProduction) {
            browser = await puppeteer_1.default.launch({
                executablePath: "/usr/bin/chromium-browser",
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });
        }
        else {
            browser = await puppeteer_1.default.launch();
        }
        const page = await browser.newPage();
        await page.setContent(html);
        await page.pdf({ path: fullPath, format: "A4" });
        await browser.close();
        return { fullPath, relativePath };
    }
    async getmerchantWithdrawFiatTxListinAdmin(user, query) {
        try {
            const { pageNo, limitVal } = query;
            const page = pageNo ? parseInt(pageNo, 10) : 1;
            const limit = limitVal ? parseInt(limitVal, 10) : 10;
            const totalCount = await this.fiatWithdrawModel.countDocuments();
            const skip = (page - 1) * limit;
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
        }
        catch (error) {
            console.log("An error occurred:", error.message);
            throw new common_1.BadRequestException("An error occurred while retrieving transactions.");
        }
    }
    async adminFiatTransfer(query, dto) {
        try {
            const { fiatWithdrawId, txHash } = dto;
            const withdrawData = await this.fiatWithdrawModel.findById(fiatWithdrawId);
            if (!withdrawData) {
                throw new common_1.BadRequestException("Invalid withdrawl Id");
            }
            const appInfo = await this.appsModel.findOne({
                _id: withdrawData?.appsId,
            });
            if (!appInfo) {
                throw new common_1.BadRequestException("app not found");
            }
            const deductionAmount = Number(withdrawData.withdrawlAmount);
            if (appInfo.totalFiatBalance < deductionAmount) {
                throw new common_1.BadRequestException("Insufficient fiat balance to process withdrawal");
            }
            const updatedBalance = Number(appInfo.totalFiatBalance) - Number(deductionAmount);
            const updatedApp = await this.appsModel.findByIdAndUpdate(appInfo._id, {
                totalFiatBalance: updatedBalance,
            }, { new: true });
            const updatedWithdraw = await this.fiatWithdrawModel.findByIdAndUpdate(fiatWithdrawId, {
                status: payment_enum_1.WithdrawlFiatPaymentStatus.SUCCESS,
                transferDate: new Date(),
                txHash: txHash,
            }, { new: true });
            return {
                success: true,
                data: "Fiat transfer successfully",
                withdrawData: updatedWithdraw,
                appInfo: updatedApp,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error);
            }
        }
    }
    async viewFiatTransactionById(query) {
        try {
            const { fiatWithdrawId } = query;
            if (!fiatWithdrawId) {
                throw new common_1.BadRequestException("Fiat withdrwal Id is required");
            }
            const fiatData = await this.fiatWithdrawModel
                .findById(fiatWithdrawId)
                .populate({
                path: "appsId",
                select: "name totalFiatBalance",
            })
                .populate({
                path: "merchantId",
                select: "name email countryCode contactNumber",
            });
            if (!fiatData) {
                throw new common_1.BadRequestException("Invalid fiat withdrwal Id");
            }
            return { success: true, message: "Fiat withdrawl data", fiatData };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error);
            }
        }
    }
};
exports.MerchantAppTxService = MerchantAppTxService;
exports.MerchantAppTxService = MerchantAppTxService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(apps_schema_1.Apps.name)),
    __param(1, (0, mongoose_1.InjectModel)(merchant_app_tx_schema_1.MerchantAppTx.name)),
    __param(2, (0, mongoose_1.InjectModel)(merchant_schema_1.Merchant.name)),
    __param(3, (0, mongoose_1.InjectModel)(payment_link_schema_1.PaymentLink.name)),
    __param(4, (0, mongoose_1.InjectModel)(fiat_withdraw_schema_1.FiatWithdraw.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        email_service_1.EmailService,
        admin_service_1.AdminService,
        token_service_1.TokenService,
        encryption_service_1.EncryptionService])
], MerchantAppTxService);
//# sourceMappingURL=merchant-app-tx.service.js.map