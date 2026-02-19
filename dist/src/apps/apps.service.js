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
exports.AppsService = void 0;
const tron_helper_1 = require("./../helpers/tron.helper");
const common_1 = require("@nestjs/common");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const apps_schema_1 = require("./schema/apps.schema");
const crypto = __importStar(require("crypto"));
const encryption_service_1 = require("../utils/encryption.service");
const evm_helper_1 = require("../helpers/evm.helper");
const wallet_monitor_schema_1 = require("../wallet-monitor/schema/wallet-monitor.schema");
const wallet_monitor_enum_1 = require("../wallet-monitor/schema/wallet-monitor.enum");
const config_service_1 = require("../config/config.service");
const moralis_1 = __importDefault(require("moralis"));
const tron_helper_2 = require("../helpers/tron.helper");
const bitcoin_helper_1 = require("../helpers/bitcoin.helper");
const notification_schema_1 = require("../notification/schema/notification.schema");
const token_schema_1 = require("../token/schema/token.schema");
const payment_link_schema_1 = require("../payment-link/schema/payment-link.schema");
const fiat_withdraw_schema_1 = require("../merchant-app-tx/schema/fiat-withdraw.schema");
const merchant_schema_1 = require("../merchants/schema/merchant.schema");
const webhook_service_1 = require("../webhook/webhook.service");
let AppsService = class AppsService {
    constructor(appsModel, merchantModel, monitorModel, notificationModel, tokenModel, paymentLinkModel, fiatWithdrawModel, encryptionService, webhookService) {
        this.appsModel = appsModel;
        this.merchantModel = merchantModel;
        this.monitorModel = monitorModel;
        this.notificationModel = notificationModel;
        this.tokenModel = tokenModel;
        this.paymentLinkModel = paymentLinkModel;
        this.fiatWithdrawModel = fiatWithdrawModel;
        this.encryptionService = encryptionService;
        this.webhookService = webhookService;
    }
    async addApp(user, dto, file) {
        try {
            const { name, description } = dto;
            const getTokens = await this.tokenModel.find({
                chainId: { $in: ["TRON"] },
                code: { $in: ["TRX"] },
            });
            const tronTokenContractAddress = await getTokens[0]?.address;
            const tronTokenDecimal = await getTokens[0]?.decimal;
            const tronAdminPvtKey = config_service_1.ConfigService.keys.TRON_ADMIN_PRIVATE_KEY;
            const tronAdminAddress = config_service_1.ConfigService.keys.TRON_ADMIN_ADDRESS;
            const tronAmount = 1.1;
            const totalActivationCost = tronAmount + 0.5;
            const isAdminBalance = await (0, tron_helper_1.getTronBalance)(tronAdminAddress);
            const appExist = await this.appsModel.findOne({ name });
            if (appExist) {
                throw new common_1.NotAcceptableException("This app is already present");
            }
            const totalUserApp = await this.appsModel.find({
                merchantId: user?.userId,
            });
            if (totalUserApp?.length > 2) {
                throw new common_1.BadRequestException("Only 3 apps can generated");
            }
            const model = await new this.appsModel();
            const publicKey = crypto.randomBytes(48).toString("base64url");
            const privateKey = crypto.randomBytes(48).toString("base64url");
            if (publicKey === privateKey) {
                throw new common_1.NotAcceptableException("Both keys are same");
            }
            if (!publicKey || !privateKey) {
                throw new common_1.NotAcceptableException("Keys not generated properly");
            }
            const generate = (0, evm_helper_1.generateMnemonic)();
            if (!generate) {
                throw new common_1.NotAcceptableException("Error in generating Mnemonic");
            }
            const walletInfo = await (0, evm_helper_1.generateEvmWallet)(generate, 0);
            const tronWallet = await (0, tron_helper_2.generateTronWallet)(generate, 0);
            const btcWallet = await (0, bitcoin_helper_1.generateBitcoinWallet)(generate, 0);
            if (!walletInfo && !tronWallet && !btcWallet) {
                throw new common_1.NotAcceptableException("Error in generating wallet");
            }
            const encryptedPrivateKey = this.encryptionService.encryptData(walletInfo?.privateKey);
            const encryptedMnemonicPhrase = this.encryptionService.encryptData(walletInfo?.mnemonic.phrase);
            const encryptedMnemonicPath = this.encryptionService.encryptData(walletInfo?.mnemonic.path);
            const encryptedTronPrivateKey = this.encryptionService.encryptData(tronWallet?.privateKey);
            const encryptedTronMnemonicPath = this.encryptionService.encryptData(tronWallet?.path);
            const encryptedBtcPrivateKey = this.encryptionService.encryptData(btcWallet?.privateKey);
            const encryptedBtcMnemonicPath = this.encryptionService.encryptData(btcWallet?.path);
            if (publicKey && privateKey && tronWallet?.address) {
                model.merchantId = user?.userId;
                model.name = name.trim();
                model.description = description.trim();
                console.log("Adding App - DTO:", JSON.stringify(dto));
                const { theme } = dto;
                if (theme) {
                    console.log("Setting theme:", theme);
                    model.theme = theme;
                }
                if (file) {
                    model.logo = file.path.replace(/\\/g, "/");
                }
                model.API_KEY = this.encryptionService.encryptData(publicKey);
                model.SECRET_KEY = this.encryptionService.encryptData(privateKey);
                model.currentIndexVal = walletInfo?.index;
                model.tronCurrentIndexVal = tronWallet?.index;
                model.EVMWalletMnemonic = {
                    address: walletInfo?.address,
                    privateKey: encryptedPrivateKey,
                    mnemonic: {
                        phrase: encryptedMnemonicPhrase,
                        path: encryptedMnemonicPath,
                        locale: walletInfo?.mnemonic.locale,
                    },
                };
                model.TronWalletMnemonic = {
                    address: tronWallet?.address,
                    privateKey: encryptedTronPrivateKey,
                    mnemonic: {
                        phrase: encryptedMnemonicPhrase,
                        path: encryptedTronMnemonicPath,
                        locale: walletInfo?.mnemonic.locale,
                    },
                };
                model.BtcWalletMnemonic = {
                    address: btcWallet?.address,
                    privateKey: encryptedBtcPrivateKey,
                    mnemonic: {
                        phrase: encryptedMnemonicPhrase,
                        path: encryptedBtcMnemonicPath,
                        locale: walletInfo?.mnemonic.locale,
                    },
                };
                if (isAdminBalance >= totalActivationCost) {
                    console.log("isAdminBalance", isAdminBalance);
                    console.log("totalActivationCost", totalActivationCost);
                    const initialTronTransfer = await (0, tron_helper_2.transferTron)(tronAdminPvtKey, tronTokenContractAddress, tronWallet?.address, tronAmount, tronTokenDecimal);
                    console.log("initialTronTransfer receipt:", JSON.stringify(initialTronTransfer));
                    const tronTransferOk = initialTronTransfer &&
                        typeof initialTronTransfer === 'object' &&
                        initialTronTransfer.result === true &&
                        !initialTronTransfer.code;
                    if (tronTransferOk) {
                        await model.save();
                        const notificationModel = new this.notificationModel({
                            merchantId: model?.merchantId,
                            message: "App Created successfully",
                        });
                        await notificationModel.save();
                        try {
                            await moralis_1.default.Streams.addAddress({
                                id: config_service_1.ConfigService.keys.WEB_STREAMER_ID,
                                address: model?.EVMWalletMnemonic?.address,
                            });
                        }
                        catch (moralisError) {
                            console.log("Warning: Moralis.Streams.addAddress failed (non-critical):", moralisError?.message || moralisError);
                        }
                        const wallet = await new this.monitorModel();
                        wallet.appId = model?._id;
                        wallet.walletAddress = model?.EVMWalletMnemonic?.address;
                        wallet.tokenAddress = "All Native Currency and Tokens";
                        wallet.chainId = "0";
                        wallet.expiryTime = 0;
                        wallet.walletType = wallet_monitor_enum_1.WalletType.APP;
                        wallet.appId = model._id;
                        wallet.isExpiry = false;
                        wallet.streamId = config_service_1.ConfigService.keys.WEB_STREAMER_ID;
                        await wallet.save();
                        return { message: "App created succesfully" };
                    }
                }
                else {
                    throw new common_1.NotAcceptableException("Admin don't have sufficient TRX for creating a new app.");
                }
            }
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
    async getApps00(user, query) {
        try {
            const { pageNo, limitVal, search } = query;
            const page = pageNo ? parseInt(pageNo) : 1;
            const limit = limitVal ? parseInt(limitVal) : 10;
            let queryObject = { merchantId: user?.userId };
            if (search) {
                queryObject = {
                    ...queryObject,
                    $or: [{ name: { $regex: search, $options: "i" } }],
                };
            }
            const app = await this.appsModel
                .find(queryObject)
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ _id: -1 });
            const count = await this.appsModel.countDocuments(queryObject);
            const totalPages = Math.ceil(count / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;
            return {
                message: "apss info",
                total: count,
                totalPages: totalPages,
                currentPage: page,
                hasNextPage: hasNextPage,
                hasPrevPage: hasPrevPage,
                data: app,
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
    async getApps(user, query) {
        try {
            const { pageNo, limitVal, search } = query;
            const page = pageNo ? parseInt(pageNo) : 1;
            const limit = limitVal ? parseInt(limitVal) : 10;
            let queryObject = { merchantId: user?.userId };
            if (search) {
                queryObject = {
                    ...queryObject,
                    $or: [{ name: { $regex: search, $options: "i" } }],
                };
            }
            const apps = await this.appsModel
                .find(queryObject)
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ _id: -1 });
            const count = await this.appsModel.countDocuments(queryObject);
            const totalPages = Math.ceil(count / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;
            const updatedApps = apps.map((app) => {
                const appObj = app.toObject();
                if (appObj.logo) {
                    appObj.logo = appObj.logo.replace(/\\/g, "/");
                }
                return appObj;
            });
            let merchantTotalFiat = 0;
            for (let app of updatedApps) {
                const appId = app?._id;
                const transactions = await this.paymentLinkModel.find({ appId });
                const fiatWithdrawl = await this.fiatWithdrawModel.find({ appsId: appId });
                let totalSuccessFiat = 0;
                transactions.forEach((txn) => {
                    if (txn.transactionType === "FIAT" && txn.status === "SUCCESS") {
                        totalSuccessFiat += Number(txn.fiatToUsd) || 0;
                    }
                });
                fiatWithdrawl.forEach((wd) => {
                    if (wd.status === "SUCCESS") {
                        totalSuccessFiat -= Number(wd.withdrawlAmount) || 0;
                    }
                });
                merchantTotalFiat += Number(totalSuccessFiat);
                await this.merchantModel.findByIdAndUpdate(user?.userId, { totalFiatBalance: Number(merchantTotalFiat.toFixed(6)) }, { new: true });
            }
            return {
                message: "apps info",
                total: count,
                totalPages,
                currentPage: page,
                hasNextPage,
                hasPrevPage,
                merchantTotalFiat: Number(merchantTotalFiat.toFixed(6)),
                data: updatedApps,
            };
        }
        catch (error) {
            console.log("An error occurred:", error.message);
            throw new common_1.BadRequestException(error);
        }
    }
    async appById(user, query) {
        try {
            const userId = user?.userId;
            const { appId } = query;
            const app = await this.appsModel.findOne({
                _id: appId,
                merchantId: userId,
            });
            if (!app) {
                throw new common_1.NotFoundException("Invalid app Id");
            }
            const transactions = await this.paymentLinkModel.find({ appId });
            const fiatWithdrawl = await this.fiatWithdrawModel.find({
                appsId: appId,
            });
            let totalSuccessFiat = 0;
            transactions.forEach((txn) => {
                if (txn.transactionType === "FIAT" && txn.status === "SUCCESS") {
                    totalSuccessFiat += Number(txn.fiatToUsd) || 0;
                }
            });
            let totalPendingWithdraw = 0;
            fiatWithdrawl.forEach((wd) => {
                if (wd.status === "SUCCESS") {
                    totalSuccessFiat -= Number(wd?.withdrawlAmount) || 0;
                }
            });
            await this.appsModel.findByIdAndUpdate(appId, { totalFiatBalance: Number(totalSuccessFiat.toFixed(6)) }, { new: true });
            const appObj = app.toObject();
            if (appObj.logo) {
                appObj.logo = appObj.logo.replace(/\\/g, "/");
            }
            return {
                message: "apps by Id",
                totalFiatToUsd: Number(totalSuccessFiat.toFixed(6)),
                totalSuccessFiat,
                totalPendingWithdraw,
                data: appObj,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message || error);
        }
    }
    async getKeys(user, query) {
        try {
            const userId = user?.userId;
            const { appId } = query;
            const app = await this.appsModel.findById({
                _id: appId,
                merchantId: userId,
            });
            if (!app) {
                return new common_1.NotFoundException("Invalid app Id");
            }
            const publicKey = await this.encryptionService.decryptData(app?.API_KEY);
            const privateKey = await this.encryptionService.decryptData(app?.SECRET_KEY);
            return {
                message: "public and private keys",
                publicKey: publicKey,
                privateKey: privateKey,
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
    async updateApp(user, query, dto, file) {
        try {
            const userId = user?.userId;
            const { appId } = query;
            const { name, description } = dto;
            const app = await this.appsModel.findById({
                _id: appId,
                merchantId: userId,
            });
            if (!app) {
                return new common_1.NotFoundException("Invalid app Id");
            }
            if (name)
                app.name = name.trim();
            if (description)
                app.description = description.trim();
            const { theme, removeLogo } = dto;
            if (theme) {
                app.theme = theme;
            }
            if (removeLogo === "true") {
                app.logo = "";
            }
            else if (file) {
                app.logo = file.path.replace(/\\/g, "/");
            }
            await app.save();
            return { message: "App updated successfully", data: app };
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
    async deleteApp(user, query) {
        try {
            const userId = user?.userId;
            const { appId } = query;
            const app = await this.appsModel.findByIdAndDelete({
                _id: appId,
                merchantId: userId,
            });
            if (!app) {
                return new common_1.NotFoundException("Invalid app Id");
            }
            return {
                message: "Deleted App successfully",
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
    async appList(query) {
        try {
            const { pageNo, limitVal, search, merchantId } = query;
            const page = pageNo ? parseInt(pageNo) : 1;
            const limit = limitVal ? parseInt(limitVal) : 10;
            let queryObject = { merchantId: merchantId };
            if (search) {
                queryObject = {
                    ...queryObject,
                    $or: [{ name: { $regex: search, $options: "i" } }],
                };
            }
            const app = await this.appsModel
                .find(queryObject)
                .skip((page - 1) * limit)
                .select({
                _id: 1,
                merchantId: 1,
                name: 1,
                description: 1,
                createdAt: 1,
            })
                .limit(limit)
                .sort({ _id: -1 });
            const count = await this.appsModel.countDocuments(queryObject);
            const totalPages = Math.ceil(count / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;
            return {
                message: "apss info",
                total: count,
                totalPages: totalPages,
                currentPage: page,
                hasNextPage: hasNextPage,
                hasPrevPage: hasPrevPage,
                data: app,
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
    async getUnreadNotificationCount(user) {
        try {
            const count = await this.notificationModel.countDocuments({
                merchantId: user?.userId,
                isRead: false,
            });
            return {
                message: "Unread notification count",
                count,
            };
        }
        catch (error) {
            console.log("An error occurred:", error.message);
            throw new common_1.BadRequestException(error);
        }
    }
    async viewMerchantApp(id) {
        try {
            const app = await this.appsModel.findById(id);
            if (!app) {
                throw new common_1.NotFoundException("Invalid App Id");
            }
            const apiKey = this.encryptionService.decryptData(app?.API_KEY);
            const secretKey = this.encryptionService.decryptData(app?.SECRET_KEY);
            const appWithKeys = {
                ...app.toObject(),
                apiKey,
                secretKey,
            };
            return {
                message: "View App",
                app: appWithKeys,
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
    async updateWebhook(user, query, dto) {
        try {
            const { appId } = query;
            const { webhookUrl, webhookSecret } = dto;
            const app = await this.appsModel.findOne({
                _id: appId,
                merchantId: user?.userId,
            });
            if (!app) {
                throw new common_1.NotFoundException("App not found or unauthorized");
            }
            const updateData = { webhookUrl };
            if (webhookSecret) {
                updateData.webhookSecret = this.encryptionService.encryptData(webhookSecret);
            }
            await this.appsModel.updateOne({ _id: appId }, { $set: updateData });
            return {
                message: "Webhook configuration updated successfully",
                webhookUrl,
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
    async updateWebhookWithApiKey(dto) {
        try {
            const { appId, apiKey, secretKey, webhookUrl, webhookSecret } = dto;
            const app = await this.appsModel.findById(appId);
            if (!app) {
                throw new common_1.NotFoundException("App not found");
            }
            const storedApiKey = this.encryptionService.decryptData(app.API_KEY);
            const storedSecretKey = this.encryptionService.decryptData(app.SECRET_KEY);
            if (apiKey !== storedApiKey) {
                throw new common_1.BadRequestException("Invalid API Key");
            }
            if (secretKey !== storedSecretKey) {
                throw new common_1.BadRequestException("Invalid Secret Key");
            }
            const updateData = { webhookUrl };
            if (webhookSecret) {
                updateData.webhookSecret = this.encryptionService.encryptData(webhookSecret);
            }
            await this.appsModel.updateOne({ _id: appId }, { $set: updateData });
            return {
                status: true,
                message: "Webhook configuration updated successfully",
                webhookUrl,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error.message || "Failed to update webhook");
            }
        }
    }
    async getWebhookLogsWithApiKey(dto) {
        try {
            const { appId, apiKey, secretKey, pageNo = 1, limitVal = 20, status, event } = dto;
            const app = await this.appsModel.findById(appId);
            if (!app) {
                throw new common_1.NotFoundException("App not found");
            }
            const storedApiKey = this.encryptionService.decryptData(app.API_KEY);
            const storedSecretKey = this.encryptionService.decryptData(app.SECRET_KEY);
            if (apiKey !== storedApiKey) {
                throw new common_1.BadRequestException("Invalid API Key");
            }
            if (secretKey !== storedSecretKey) {
                throw new common_1.BadRequestException("Invalid Secret Key");
            }
            return await this.webhookService.getWebhookLogs(appId, { pageNo, limitVal, status, event });
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error.message || "Failed to get webhook logs");
            }
        }
    }
};
exports.AppsService = AppsService;
exports.AppsService = AppsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(apps_schema_1.Apps.name)),
    __param(1, (0, mongoose_2.InjectModel)(merchant_schema_1.Merchant.name)),
    __param(2, (0, mongoose_2.InjectModel)(wallet_monitor_schema_1.WalletMonitor.name)),
    __param(3, (0, mongoose_2.InjectModel)(notification_schema_1.Notification.name)),
    __param(4, (0, mongoose_2.InjectModel)(token_schema_1.Token.name)),
    __param(5, (0, mongoose_2.InjectModel)(payment_link_schema_1.PaymentLink.name)),
    __param(6, (0, mongoose_2.InjectModel)(fiat_withdraw_schema_1.FiatWithdraw.name)),
    __metadata("design:paramtypes", [mongoose_1.Model,
        mongoose_1.Model,
        mongoose_1.Model,
        mongoose_1.Model,
        mongoose_1.Model,
        mongoose_1.Model,
        mongoose_1.Model,
        encryption_service_1.EncryptionService,
        webhook_service_1.WebhookService])
], AppsService);
//# sourceMappingURL=apps.service.js.map