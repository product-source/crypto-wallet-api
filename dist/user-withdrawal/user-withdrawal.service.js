"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
exports.UserWithdrawalService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const axios_1 = __importDefault(require("axios"));
const user_withdrawal_schema_1 = require("./schema/user-withdrawal.schema");
const user_withdrawal_enum_1 = require("./schema/user-withdrawal.enum");
const apps_schema_1 = require("../apps/schema/apps.schema");
const token_schema_1 = require("../token/schema/token.schema");
const merchant_schema_1 = require("../merchants/schema/merchant.schema");
const encryption_service_1 = require("../utils/encryption.service");
const webhook_service_1 = require("../webhook/webhook.service");
const webhook_log_schema_1 = require("../webhook/schema/webhook-log.schema");
const config_service_1 = require("../config/config.service");
const evm_helper_1 = require("../helpers/evm.helper");
const tron_helper_1 = require("../helpers/tron.helper");
const bitcoin_helper_1 = require("../helpers/bitcoin.helper");
let UserWithdrawalService = class UserWithdrawalService {
    constructor(userWithdrawalModel, appsModel, tokenModel, merchantModel, encryptionService, webhookService) {
        this.userWithdrawalModel = userWithdrawalModel;
        this.appsModel = appsModel;
        this.tokenModel = tokenModel;
        this.merchantModel = merchantModel;
        this.encryptionService = encryptionService;
        this.webhookService = webhookService;
    }
    async validateAppCredentials(appId, apiKey, secretKey) {
        if (!appId || !apiKey || !secretKey) {
            throw new common_1.BadRequestException("Missing authentication credentials");
        }
        const app = await this.appsModel.findById(appId);
        if (!app) {
            throw new common_1.NotFoundException("Invalid App ID");
        }
        try {
            const storedApiKey = this.encryptionService.decryptData(app.API_KEY);
            const storedSecretKey = this.encryptionService.decryptData(app.SECRET_KEY);
            if (apiKey !== storedApiKey) {
                throw new common_1.BadRequestException("Invalid API Key");
            }
            if (secretKey !== storedSecretKey) {
                throw new common_1.BadRequestException("Invalid Secret Key");
            }
        }
        catch (e) {
            throw new common_1.BadRequestException("Error validating credentials");
        }
        return app;
    }
    async checkDailyLimits(appId, userId, amountInUsd) {
        const app = await this.appsModel.findById(appId);
        if (!app) {
            return { allowed: false, reason: "App not found" };
        }
        if (app.dailyWithdrawalRequestLimit === 0 &&
            app.dailyWithdrawalAmountLimit === 0) {
            return { allowed: true };
        }
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const todayWithdrawals = await this.userWithdrawalModel.find({
            appsId: appId,
            userId,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: user_withdrawal_enum_1.UserWithdrawalStatus.DECLINED },
        });
        if (app.dailyWithdrawalRequestLimit > 0 &&
            todayWithdrawals.length >= app.dailyWithdrawalRequestLimit) {
            return {
                allowed: false,
                reason: `Daily withdrawal request limit of ${app.dailyWithdrawalRequestLimit} reached`,
            };
        }
        if (app.dailyWithdrawalAmountLimit > 0) {
            const totalTodayAmount = todayWithdrawals.reduce((sum, w) => sum + (w.amountInUsd || 0), 0);
            if (totalTodayAmount + amountInUsd > app.dailyWithdrawalAmountLimit) {
                return {
                    allowed: false,
                    reason: `Daily withdrawal amount limit of ${app.dailyWithdrawalAmountLimit} USD would be exceeded`,
                };
            }
        }
        return { allowed: true };
    }
    async checkCooldown(appId, userId) {
        const app = await this.appsModel.findById(appId);
        if (!app) {
            return { allowed: false, reason: "App not found" };
        }
        if (!app.withdrawalCooldownMinutes || app.withdrawalCooldownMinutes === 0) {
            return { allowed: true };
        }
        const lastWithdrawal = await this.userWithdrawalModel
            .findOne({
            appsId: appId,
            userId,
        })
            .sort({ createdAt: -1 });
        if (!lastWithdrawal) {
            return { allowed: true };
        }
        const cooldownMs = app.withdrawalCooldownMinutes * 60 * 1000;
        const timeSinceLastRequest = Date.now() - new Date(lastWithdrawal.createdAt).getTime();
        if (timeSinceLastRequest < cooldownMs) {
            const waitMinutes = Math.ceil((cooldownMs - timeSinceLastRequest) / 60000);
            return {
                allowed: false,
                reason: `Cooldown period not passed. Please wait ${waitMinutes} minutes`,
                waitMinutes,
            };
        }
        return { allowed: true };
    }
    async checkChainBalance(app, token, amount) {
        try {
            const chainId = token.chainId;
            const amountNum = parseFloat(amount);
            let walletAddress;
            if (chainId === "TRON") {
                walletAddress = app.TronWalletMnemonic?.address;
            }
            else if (chainId === "BTC") {
                walletAddress = app.BtcWalletMnemonic?.address;
            }
            else {
                walletAddress = app.EVMWalletMnemonic?.address;
            }
            if (!walletAddress) {
                console.error("No wallet address configured for chain:", chainId);
                return { sufficient: false, balance: "0", required: amount };
            }
            let balanceRaw;
            let balanceNum;
            if (chainId !== "TRON" && chainId !== "BTC") {
                try {
                    const network = (0, evm_helper_1.getNetwork)(chainId);
                    balanceRaw = await (0, evm_helper_1.evmCryptoBalanceCheck)(network.rpc, token.address, walletAddress);
                    const decimal = token.decimal || 18;
                    balanceNum = parseFloat(balanceRaw?.toString() || "0") / Math.pow(10, decimal);
                }
                catch (e) {
                    console.error("Error checking EVM balance:", e);
                    return { sufficient: false, balance: "0", required: amount };
                }
            }
            else if (chainId === "TRON") {
                try {
                    const privateKey = this.encryptionService.decryptData(app.TronWalletMnemonic.privateKey);
                    if (token.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ||
                        token.symbol === "TRX") {
                        balanceNum = await (0, tron_helper_1.getTronBalance)(walletAddress);
                    }
                    else {
                        const tokenBalances = await (0, tron_helper_1.getTRC20Balance)([token], privateKey);
                        if (tokenBalances && tokenBalances.length > 0) {
                            balanceNum = parseFloat(tokenBalances[0].balance || "0");
                        }
                        else {
                            balanceNum = 0;
                        }
                    }
                }
                catch (e) {
                    console.error("Error checking TRON balance:", e);
                    return { sufficient: false, balance: "0", required: amount };
                }
            }
            else if (chainId === "BTC") {
                try {
                    const axios = require("axios");
                    const { ConfigService } = require("src/config/config.service");
                    const tatumApiKey = ConfigService.keys.TATUM_X_API_KEY;
                    const tatumNetwork = ConfigService.keys.TATUM_NETWORK || "bitcoin-testnet";
                    const baseUrl = tatumNetwork === "bitcoin-mainnet"
                        ? "https://api.tatum.io/v3/bitcoin"
                        : "https://api.tatum.io/v3/bitcoin";
                    console.log(`BTC Balance Check via Tatum - Address: ${walletAddress}, Network: ${tatumNetwork}`);
                    const response = await axios.get(`${baseUrl}/address/balance/${walletAddress}`, {
                        headers: {
                            "x-api-key": tatumApiKey,
                        },
                        timeout: 10000,
                    });
                    if (response.data) {
                        const incoming = parseFloat(response.data.incoming || "0");
                        const outgoing = parseFloat(response.data.outgoing || "0");
                        balanceNum = incoming - outgoing;
                        console.log(`BTC Balance: ${balanceNum} BTC (incoming: ${incoming}, outgoing: ${outgoing})`);
                    }
                    else {
                        balanceNum = 0;
                    }
                }
                catch (e) {
                    console.error("Error checking BTC balance via Tatum:", e?.response?.data || e?.message || e);
                    return { sufficient: false, balance: "0", required: amount };
                }
            }
            else {
                return { sufficient: false, balance: "0", required: amount };
            }
            const sufficient = balanceNum >= amountNum;
            return {
                sufficient,
                balance: balanceNum.toFixed(8),
                required: amount,
            };
        }
        catch (error) {
            console.error("Error checking chain balance:", error);
            return { sufficient: false, balance: "0", required: amount };
        }
    }
    async createWithdrawalRequest(dto, app) {
        try {
            const { userId, userEmail, userName, amount, code, walletAddress, externalReference, note, } = dto;
            const appId = app ? app._id : dto.appId;
            if (!appId) {
                throw new common_1.BadRequestException("App ID is required");
            }
            let foundApp = app;
            if (!foundApp) {
                foundApp = await this.appsModel.findById(appId);
                if (!foundApp) {
                    throw new common_1.NotFoundException("App not found");
                }
            }
            if (!foundApp.isUserWithdrawalEnabled) {
                throw new common_1.BadRequestException("User withdrawals are disabled for this app");
            }
            const token = await this.tokenModel.findOne({ code });
            if (!token) {
                throw new common_1.NotFoundException(`Token with code ${code} not found`);
            }
            const amountNum = parseFloat(amount);
            const amountInUsd = amountNum;
            if (foundApp.minWithdrawalAmount > 0 && amountInUsd < foundApp.minWithdrawalAmount) {
                throw new common_1.BadRequestException(`Minimum withdrawal amount is ${foundApp.minWithdrawalAmount} USD`);
            }
            const cooldownCheck = await this.checkCooldown(appId, userId);
            if (!cooldownCheck.allowed) {
                throw new common_1.BadRequestException(cooldownCheck.reason);
            }
            const limitsCheck = await this.checkDailyLimits(appId, userId, amountInUsd);
            if (!limitsCheck.allowed) {
                throw new common_1.BadRequestException(limitsCheck.reason);
            }
            let shouldAutoApprove = foundApp.isAutoWithdrawalEnabled &&
                foundApp.maxAutoWithdrawalLimit > 0 &&
                amountInUsd <= foundApp.maxAutoWithdrawalLimit;
            let insufficientFundsAtCreation = false;
            if (shouldAutoApprove) {
                const balanceCheck = await this.checkChainBalance(foundApp, token, amount);
                if (!balanceCheck.sufficient) {
                    console.log(`Auto-approval blocked: Insufficient funds. Balance: ${balanceCheck.balance}, Required: ${balanceCheck.required}`);
                    shouldAutoApprove = false;
                    insufficientFundsAtCreation = true;
                }
            }
            const withdrawal = new this.userWithdrawalModel({
                appsId: appId,
                merchantId: foundApp.merchantId,
                userId,
                userEmail,
                userName,
                amount,
                tokenId: token._id,
                tokenSymbol: token.symbol,
                chainId: token.chainId,
                walletAddress,
                externalReference,
                note,
                amountInUsd,
                insufficientFundsAtCreation,
                status: shouldAutoApprove
                    ? user_withdrawal_enum_1.UserWithdrawalStatus.AUTO_APPROVED
                    : user_withdrawal_enum_1.UserWithdrawalStatus.PENDING,
            });
            await withdrawal.save();
            const webhookEvent = shouldAutoApprove
                ? webhook_log_schema_1.WebhookEvent.WITHDRAWAL_AUTO_APPROVED
                : webhook_log_schema_1.WebhookEvent.WITHDRAWAL_PENDING;
            await this.sendWithdrawalWebhook(withdrawal._id.toString(), webhookEvent, withdrawal);
            if (shouldAutoApprove) {
                this.processWithdrawal(withdrawal._id.toString()).catch((err) => {
                    console.error("Error processing auto-approved withdrawal:", err);
                });
            }
            return {
                success: true,
                message: shouldAutoApprove
                    ? "Withdrawal request auto-approved and processing"
                    : "Withdrawal request created and pending approval",
                data: {
                    _id: withdrawal._id,
                    status: withdrawal.status,
                    externalReference,
                    createdAt: withdrawal.createdAt,
                },
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException ||
                error instanceof common_1.BadRequestException) {
                throw error;
            }
            console.error("Error creating withdrawal request:", error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async listWithdrawals(dto, merchantId) {
        try {
            const { appId, status, userId, pageNo = 1, limitVal = 10, startDate, endDate } = dto;
            const query = { appsId: appId };
            if (merchantId) {
                const app = await this.appsModel.findById(appId);
                if (!app || app.merchantId.toString() !== merchantId.toString()) {
                    throw new common_1.NotFoundException("App not found or unauthorized");
                }
            }
            if (status) {
                query.status = status;
            }
            if (userId) {
                query.userId = userId;
            }
            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) {
                    query.createdAt.$gte = new Date(startDate);
                }
                if (endDate) {
                    query.createdAt.$lte = new Date(endDate);
                }
            }
            const page = pageNo;
            const limit = limitVal;
            const [withdrawals, total] = await Promise.all([
                this.userWithdrawalModel
                    .find(query)
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .sort({ createdAt: -1 }),
                this.userWithdrawalModel.countDocuments(query),
            ]);
            const totalPages = Math.ceil(total / limit);
            return {
                success: true,
                message: "Withdrawals retrieved successfully",
                total,
                totalPages,
                currentPage: page,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                data: withdrawals,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            console.error("Error listing withdrawals:", error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async approveWithdrawal(dto, merchantId) {
        try {
            const { withdrawalId, note } = dto;
            const withdrawal = await this.userWithdrawalModel.findById(withdrawalId);
            if (!withdrawal) {
                throw new common_1.NotFoundException("Withdrawal not found");
            }
            if (merchantId &&
                withdrawal.merchantId.toString() !== merchantId.toString()) {
                throw new common_1.NotFoundException("Withdrawal not found or unauthorized");
            }
            if (withdrawal.status !== user_withdrawal_enum_1.UserWithdrawalStatus.PENDING) {
                throw new common_1.BadRequestException(`Cannot approve withdrawal with status: ${withdrawal.status}`);
            }
            withdrawal.status = user_withdrawal_enum_1.UserWithdrawalStatus.APPROVED;
            withdrawal.merchantApprovedAt = new Date();
            if (note) {
                withdrawal.note = note;
            }
            await withdrawal.save();
            await this.sendWithdrawalWebhook(withdrawalId, webhook_log_schema_1.WebhookEvent.WITHDRAWAL_APPROVED, withdrawal);
            this.processWithdrawal(withdrawalId).catch((err) => {
                console.error("Error processing approved withdrawal:", err);
            });
            return {
                success: true,
                message: "Withdrawal approved and processing",
                data: {
                    _id: withdrawal._id,
                    status: withdrawal.status,
                },
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException ||
                error instanceof common_1.BadRequestException) {
                throw error;
            }
            console.error("Error approving withdrawal:", error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async declineWithdrawal(dto, merchantId) {
        try {
            const { withdrawalId, reason } = dto;
            const withdrawal = await this.userWithdrawalModel.findById(withdrawalId);
            if (!withdrawal) {
                throw new common_1.NotFoundException("Withdrawal not found");
            }
            if (merchantId &&
                withdrawal.merchantId.toString() !== merchantId.toString()) {
                throw new common_1.NotFoundException("Withdrawal not found or unauthorized");
            }
            if (withdrawal.status !== user_withdrawal_enum_1.UserWithdrawalStatus.PENDING) {
                throw new common_1.BadRequestException(`Cannot decline withdrawal with status: ${withdrawal.status}`);
            }
            withdrawal.status = user_withdrawal_enum_1.UserWithdrawalStatus.DECLINED;
            withdrawal.declineReason = reason;
            await withdrawal.save();
            await this.sendWithdrawalWebhook(withdrawalId, webhook_log_schema_1.WebhookEvent.WITHDRAWAL_DECLINED, withdrawal);
            return {
                success: true,
                message: "Withdrawal declined",
                data: {
                    _id: withdrawal._id,
                    status: withdrawal.status,
                    declineReason: reason,
                },
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException ||
                error instanceof common_1.BadRequestException) {
                throw error;
            }
            console.error("Error declining withdrawal:", error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async processWithdrawal(withdrawalId) {
        const withdrawal = await this.userWithdrawalModel.findById(withdrawalId);
        if (!withdrawal) {
            throw new common_1.NotFoundException("Withdrawal not found");
        }
        if (withdrawal.status !== user_withdrawal_enum_1.UserWithdrawalStatus.APPROVED &&
            withdrawal.status !== user_withdrawal_enum_1.UserWithdrawalStatus.AUTO_APPROVED) {
            throw new common_1.BadRequestException(`Cannot process withdrawal with status: ${withdrawal.status}`);
        }
        withdrawal.status = user_withdrawal_enum_1.UserWithdrawalStatus.PROCESSING;
        await withdrawal.save();
        await this.sendWithdrawalWebhook(withdrawalId, webhook_log_schema_1.WebhookEvent.WITHDRAWAL_PROCESSING, withdrawal);
        try {
            const app = await this.appsModel
                .findById(withdrawal.appsId)
                .select("+EVMWalletMnemonic.privateKey +TronWalletMnemonic.privateKey +BtcWalletMnemonic.privateKey");
            if (!app) {
                throw new Error("App not found");
            }
            const token = await this.tokenModel.findById(withdrawal.tokenId);
            if (!token) {
                throw new Error("Token not found");
            }
            let receipt;
            const chainId = token.chainId;
            if (chainId === "TRON") {
                const privateKey = this.encryptionService.decryptData(app.TronWalletMnemonic.privateKey);
                receipt = await (0, tron_helper_1.merchantTronFundWithdraw)(privateKey, token.address, withdrawal.amount, withdrawal.walletAddress, token.decimal);
            }
            else if (chainId === "BTC") {
                const privateKey = this.encryptionService.decryptData(app.BtcWalletMnemonic.privateKey);
                receipt = await (0, bitcoin_helper_1.merchantBtcFundWithdraw)(privateKey, parseFloat(withdrawal.amount), withdrawal.walletAddress, app.BtcWalletMnemonic.address, 0, "");
            }
            else {
                const privateKey = this.encryptionService.decryptData(app.EVMWalletMnemonic.privateKey);
                receipt = await (0, evm_helper_1.merchantEvmFundWithdraw)(chainId, privateKey, token.address, parseFloat(withdrawal.amount), withdrawal.walletAddress, token.decimal, null);
            }
            if (receipt?.status === false || receipt?.error) {
                throw new Error(receipt?.error || "Transaction failed");
            }
            withdrawal.status = user_withdrawal_enum_1.UserWithdrawalStatus.SUCCESS;
            withdrawal.txHash = receipt?.data?.transactionHash || receipt?.txid || "";
            withdrawal.processedAt = new Date();
            await withdrawal.save();
            await this.sendWithdrawalWebhook(withdrawalId, webhook_log_schema_1.WebhookEvent.WITHDRAWAL_SUCCESS, withdrawal);
            await this.sendWithdrawalEmail(withdrawal, "success");
            return {
                success: true,
                txHash: withdrawal.txHash,
            };
        }
        catch (error) {
            console.error("Error processing withdrawal:", error);
            withdrawal.status = user_withdrawal_enum_1.UserWithdrawalStatus.FAILED;
            withdrawal.failureReason = error.message;
            await withdrawal.save();
            await this.sendWithdrawalWebhook(withdrawalId, webhook_log_schema_1.WebhookEvent.WITHDRAWAL_FAILED, withdrawal);
            await this.sendWithdrawalEmail(withdrawal, "failed");
            throw error;
        }
    }
    async getWalletBalance(appId) {
        try {
            const app = await this.appsModel.findById(appId);
            if (!app) {
                throw new common_1.NotFoundException("App not found");
            }
            const tokens = await this.tokenModel.find();
            const balances = await Promise.all(tokens.map(async (token) => {
                const chainId = token.chainId;
                let walletAddress = "";
                let balance = "N/A";
                if (chainId === "TRON") {
                    walletAddress = app.TronWalletMnemonic?.address || "";
                }
                else if (chainId === "BTC") {
                    walletAddress = app.BtcWalletMnemonic?.address || "";
                }
                else {
                    walletAddress = app.EVMWalletMnemonic?.address || "";
                }
                if (!walletAddress) {
                    return {
                        tokenId: token._id,
                        symbol: token.symbol,
                        code: token.code,
                        chainId: token.chainId,
                        network: token.network,
                        walletAddress: "",
                        balance: "N/A",
                    };
                }
                try {
                    if (chainId !== "TRON" && chainId !== "BTC") {
                        const network = (0, evm_helper_1.getNetwork)(chainId);
                        const balanceRaw = await (0, evm_helper_1.evmCryptoBalanceCheck)(network.rpc, token.address, walletAddress);
                        const decimal = token.decimal || 18;
                        const balanceNum = parseFloat(balanceRaw?.toString() || "0") / Math.pow(10, decimal);
                        balance = balanceNum.toFixed(6);
                    }
                    else if (chainId === "TRON") {
                        if (token.symbol === "TRX") {
                            const trxBalance = await (0, tron_helper_1.getTronBalance)(walletAddress);
                            balance = trxBalance.toFixed(6);
                        }
                        else {
                            const privateKey = this.encryptionService.decryptData(app.TronWalletMnemonic.privateKey);
                            const tokenBalances = await (0, tron_helper_1.getTRC20Balance)([token], privateKey);
                            if (tokenBalances && tokenBalances.length > 0) {
                                balance = parseFloat(tokenBalances[0].balance || "0").toFixed(6);
                            }
                        }
                    }
                    else if (chainId === "BTC") {
                        const tatumApiKey = config_service_1.ConfigService.keys.TATUM_X_API_KEY;
                        const response = await axios_1.default.get(`https://api.tatum.io/v3/bitcoin/address/balance/${walletAddress}`, {
                            headers: { "x-api-key": tatumApiKey },
                            timeout: 10000,
                        });
                        if (response.data) {
                            const incoming = parseFloat(response.data.incoming || "0");
                            const outgoing = parseFloat(response.data.outgoing || "0");
                            balance = (incoming - outgoing).toFixed(8);
                        }
                    }
                }
                catch (e) {
                    console.error(`Error fetching balance for ${token.symbol} on ${chainId}:`, e?.message || e);
                    balance = "Error";
                }
                return {
                    tokenId: token._id,
                    symbol: token.symbol,
                    code: token.code,
                    chainId: token.chainId,
                    network: token.network,
                    walletAddress,
                    balance,
                };
            }));
            return {
                success: true,
                data: {
                    appId,
                    balances,
                },
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            console.error("Error getting wallet balance:", error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getWithdrawalStatus(withdrawalId, merchantId) {
        const withdrawal = await this.userWithdrawalModel.findById(withdrawalId);
        if (!withdrawal) {
            throw new common_1.NotFoundException("Withdrawal not found");
        }
        if (merchantId && withdrawal.merchantId.toString() !== merchantId.toString()) {
            throw new common_1.NotFoundException("Withdrawal not found or unauthorized");
        }
        return {
            success: true,
            data: {
                _id: withdrawal._id,
                status: withdrawal.status,
                txHash: withdrawal.txHash,
                failureReason: withdrawal.failureReason,
                createdAt: withdrawal.createdAt,
                processedAt: withdrawal.processedAt,
            },
        };
    }
    async updateWithdrawalSettings(dto, merchantId) {
        try {
            const { appId, ...settings } = dto;
            const app = await this.appsModel.findOne({
                _id: appId,
                merchantId,
            });
            if (!app) {
                throw new common_1.NotFoundException("App not found or unauthorized");
            }
            const updateData = {};
            if (typeof settings.isUserWithdrawalEnabled === "boolean") {
                updateData.isUserWithdrawalEnabled = settings.isUserWithdrawalEnabled;
            }
            if (typeof settings.isAutoWithdrawalEnabled === "boolean") {
                updateData.isAutoWithdrawalEnabled = settings.isAutoWithdrawalEnabled;
            }
            if (typeof settings.maxAutoWithdrawalLimit === "number") {
                updateData.maxAutoWithdrawalLimit = settings.maxAutoWithdrawalLimit;
            }
            if (typeof settings.minWithdrawalAmount === "number") {
                updateData.minWithdrawalAmount = settings.minWithdrawalAmount;
            }
            if (typeof settings.dailyWithdrawalRequestLimit === "number") {
                updateData.dailyWithdrawalRequestLimit = settings.dailyWithdrawalRequestLimit;
            }
            if (typeof settings.dailyWithdrawalAmountLimit === "number") {
                updateData.dailyWithdrawalAmountLimit = settings.dailyWithdrawalAmountLimit;
            }
            if (typeof settings.withdrawalCooldownMinutes === "number") {
                updateData.withdrawalCooldownMinutes = settings.withdrawalCooldownMinutes;
            }
            await this.appsModel.updateOne({ _id: appId }, { $set: updateData });
            return {
                success: true,
                message: "Withdrawal settings updated successfully",
                data: updateData,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            console.error("Error updating withdrawal settings:", error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async sendWithdrawalWebhook(withdrawalId, event, withdrawal) {
        try {
            const payload = {
                withdrawalId,
                user: {
                    userId: withdrawal.userId,
                    userEmail: withdrawal.userEmail,
                    userName: withdrawal.userName,
                },
                withdrawal: {
                    amount: withdrawal.amount,
                    tokenSymbol: withdrawal.tokenSymbol,
                    chainId: withdrawal.chainId,
                    walletAddress: withdrawal.walletAddress,
                    txHash: withdrawal.txHash,
                    adminFee: withdrawal.adminFee,
                    externalReference: withdrawal.externalReference,
                    failureReason: withdrawal.failureReason,
                    declineReason: withdrawal.declineReason,
                },
                status: withdrawal.status,
            };
            await this.webhookService.sendWebhook(withdrawal.appsId.toString(), withdrawalId, event, payload);
        }
        catch (error) {
            console.error("Error sending withdrawal webhook:", error);
        }
    }
    async sendWithdrawalEmail(withdrawal, status) {
        try {
            const merchant = await this.merchantModel.findById(withdrawal.merchantId);
            if (!merchant?.email) {
                return;
            }
            console.log(`[Email] Would send ${status} withdrawal email to ${merchant.email}`, {
                withdrawalId: withdrawal._id,
                amount: withdrawal.amount,
                tokenSymbol: withdrawal.tokenSymbol,
                status,
            });
        }
        catch (error) {
            console.error("Error sending withdrawal email:", error);
        }
    }
    async getWithdrawalHistory(merchantId, query) {
        try {
            const { pageNo = 1, limitVal = 10, status } = query;
            const apps = await this.appsModel.find({ merchantId });
            const appIds = apps.map((app) => app._id);
            const queryObj = { appsId: { $in: appIds } };
            if (status) {
                queryObj.status = status;
            }
            const [withdrawals, total] = await Promise.all([
                this.userWithdrawalModel
                    .find(queryObj)
                    .populate("appsId", "name")
                    .skip((pageNo - 1) * limitVal)
                    .limit(limitVal)
                    .sort({ createdAt: -1 }),
                this.userWithdrawalModel.countDocuments(queryObj),
            ]);
            const totalPages = Math.ceil(total / limitVal);
            return {
                success: true,
                message: "Withdrawal history retrieved",
                total,
                totalPages,
                currentPage: pageNo,
                hasNextPage: pageNo < totalPages,
                hasPrevPage: pageNo > 1,
                data: withdrawals,
            };
        }
        catch (error) {
            console.error("Error getting withdrawal history:", error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async adminListWithdrawals(query) {
        try {
            const { pageNo = 1, limitVal = 10, status, merchantId, search } = query;
            const queryObj = {};
            if (status) {
                queryObj.status = status;
            }
            if (merchantId) {
                queryObj.merchantId = merchantId;
            }
            if (search) {
                queryObj.$or = [
                    { userId: { $regex: search, $options: "i" } },
                    { userEmail: { $regex: search, $options: "i" } },
                    { walletAddress: { $regex: search, $options: "i" } },
                ];
            }
            const [withdrawals, total] = await Promise.all([
                this.userWithdrawalModel
                    .find(queryObj)
                    .populate("appsId", "name")
                    .populate("merchantId", "name email")
                    .skip((pageNo - 1) * limitVal)
                    .limit(limitVal)
                    .sort({ createdAt: -1 }),
                this.userWithdrawalModel.countDocuments(queryObj),
            ]);
            const totalPages = Math.ceil(total / limitVal);
            return {
                success: true,
                message: "All withdrawals retrieved",
                total,
                totalPages,
                currentPage: pageNo,
                hasNextPage: pageNo < totalPages,
                hasPrevPage: pageNo > 1,
                data: withdrawals,
            };
        }
        catch (error) {
            console.error("Error getting admin withdrawals:", error);
            throw new common_1.BadRequestException(error.message);
        }
    }
};
exports.UserWithdrawalService = UserWithdrawalService;
exports.UserWithdrawalService = UserWithdrawalService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_withdrawal_schema_1.UserWithdrawal.name)),
    __param(1, (0, mongoose_1.InjectModel)(apps_schema_1.Apps.name)),
    __param(2, (0, mongoose_1.InjectModel)(token_schema_1.Token.name)),
    __param(3, (0, mongoose_1.InjectModel)(merchant_schema_1.Merchant.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        encryption_service_1.EncryptionService,
        webhook_service_1.WebhookService])
], UserWithdrawalService);
//# sourceMappingURL=user-withdrawal.service.js.map