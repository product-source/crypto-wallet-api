import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import axios from "axios";
import {
    UserWithdrawal,
    UserWithdrawalDocument,
} from "./schema/user-withdrawal.schema";
import { UserWithdrawalStatus } from "./schema/user-withdrawal.enum";
import { Apps, AppsDocument } from "src/apps/schema/apps.schema";
import { Token, TokenDocument } from "src/token/schema/token.schema";
import { Merchant, MerchantDocument } from "src/merchants/schema/merchant.schema";
import { EncryptionService } from "src/utils/encryption.service";
import { WebhookService } from "src/webhook/webhook.service";
import { WebhookEvent } from "src/webhook/schema/webhook-log.schema";
import { ConfigService } from "src/config/config.service";
import { merchantEvmFundWithdraw, evmCryptoBalanceCheck, getNetwork } from "src/helpers/evm.helper";
import { merchantTronFundWithdraw, getTronBalance, getTRC20Balance } from "src/helpers/tron.helper";
import { merchantBtcFundWithdraw } from "src/helpers/bitcoin.helper";
import {
    CreateWithdrawalRequestDto,
    ApproveWithdrawalDto,
    DeclineWithdrawalDto,
    ListWithdrawalsDto,
    UpdateWithdrawalSettingsDto,
} from "./dto/user-withdrawal.dto";

@Injectable()
export class UserWithdrawalService {
    constructor(
        @InjectModel(UserWithdrawal.name)
        private readonly userWithdrawalModel: Model<UserWithdrawalDocument>,
        @InjectModel(Apps.name)
        private readonly appsModel: Model<AppsDocument>,
        @InjectModel(Token.name)
        private readonly tokenModel: Model<TokenDocument>,
        @InjectModel(Merchant.name)
        private readonly merchantModel: Model<MerchantDocument>,
        private readonly encryptionService: EncryptionService,
        private readonly webhookService: WebhookService
    ) { }

    /**
     * Validate App Credentials (replaced ApiKeyAuthGuard)
     */
    async validateAppCredentials(appId: string, apiKey: string, secretKey: string) {
        if (!appId || !apiKey || !secretKey) {
            throw new BadRequestException("Missing authentication credentials");
        }

        const app = await this.appsModel.findById(appId);
        if (!app) {
            throw new NotFoundException("Invalid App ID");
        }

        try {
            const storedApiKey = this.encryptionService.decryptData(app.API_KEY);
            const storedSecretKey = this.encryptionService.decryptData(app.SECRET_KEY);

            if (apiKey !== storedApiKey) {
                throw new BadRequestException("Invalid API Key");
            }
            if (secretKey !== storedSecretKey) {
                throw new BadRequestException("Invalid Secret Key");
            }
        } catch (e) {
            throw new BadRequestException("Error validating credentials");
        }

        return app;
    }

    /**
     * Check if a user is within their daily withdrawal limits
     */
    async checkDailyLimits(
        appId: string,
        userId: string,
        amountInUsd: number
    ): Promise<{ allowed: boolean; reason?: string }> {
        const app = await this.appsModel.findById(appId);
        if (!app) {
            return { allowed: false, reason: "App not found" };
        }

        // If daily limits are 0, no limits apply
        if (
            app.dailyWithdrawalRequestLimit === 0 &&
            app.dailyWithdrawalAmountLimit === 0
        ) {
            return { allowed: true };
        }

        // Get today's start and end timestamps
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Get all user withdrawals for today (excluding DECLINED)
        const todayWithdrawals = await this.userWithdrawalModel.find({
            appsId: appId,
            userId,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: UserWithdrawalStatus.DECLINED },
        });

        // Check request count limit
        if (
            app.dailyWithdrawalRequestLimit > 0 &&
            todayWithdrawals.length >= app.dailyWithdrawalRequestLimit
        ) {
            return {
                allowed: false,
                reason: `Daily withdrawal request limit of ${app.dailyWithdrawalRequestLimit} reached`,
            };
        }

        // Check amount limit
        if (app.dailyWithdrawalAmountLimit > 0) {
            const totalTodayAmount = todayWithdrawals.reduce(
                (sum, w) => sum + (w.amountInUsd || 0),
                0
            );
            if (totalTodayAmount + amountInUsd > app.dailyWithdrawalAmountLimit) {
                return {
                    allowed: false,
                    reason: `Daily withdrawal amount limit of ${app.dailyWithdrawalAmountLimit} USD would be exceeded`,
                };
            }
        }

        return { allowed: true };
    }

    /**
     * Check if the user has passed the cooldown period since last request
     */
    async checkCooldown(
        appId: string,
        userId: string
    ): Promise<{ allowed: boolean; reason?: string; waitMinutes?: number }> {
        const app = await this.appsModel.findById(appId);
        if (!app) {
            return { allowed: false, reason: "App not found" };
        }

        // If cooldown is 0, no cooldown applies
        if (!app.withdrawalCooldownMinutes || app.withdrawalCooldownMinutes === 0) {
            return { allowed: true };
        }

        // Get the user's last withdrawal request
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
        const timeSinceLastRequest =
            Date.now() - new Date(lastWithdrawal.createdAt).getTime();

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

    /**
     * Check if the app wallet has sufficient balance for the withdrawal
     * Used to determine if auto-approval should proceed
     */
    async checkChainBalance(
        app: any,
        token: any,
        amount: string
    ): Promise<{ sufficient: boolean; balance: string; required: string }> {
        try {
            const chainId = token.chainId;
            const amountNum = parseFloat(amount);

            // Get wallet address based on chain
            let walletAddress: string;
            if (chainId === "TRON") {
                walletAddress = app.TronWalletMnemonic?.address;
            } else if (chainId === "BTC") {
                walletAddress = app.BtcWalletMnemonic?.address;
            } else {
                walletAddress = app.EVMWalletMnemonic?.address;
            }

            if (!walletAddress) {
                console.error("No wallet address configured for chain:", chainId);
                return { sufficient: false, balance: "0", required: amount };
            }

            let balanceRaw: any;
            let balanceNum: number;

            // For EVM chains, use evmCryptoBalanceCheck
            if (chainId !== "TRON" && chainId !== "BTC") {
                try {
                    const network = getNetwork(chainId);
                    balanceRaw = await evmCryptoBalanceCheck(
                        network.rpc,
                        token.address,
                        walletAddress
                    );
                    // Convert from wei to token units
                    const decimal = token.decimal || 18;
                    balanceNum = parseFloat(balanceRaw?.toString() || "0") / Math.pow(10, decimal);
                } catch (e) {
                    console.error("Error checking EVM balance:", e);
                    // If balance check fails, assume insufficient to be safe
                    return { sufficient: false, balance: "0", required: amount };
                }
            } else if (chainId === "TRON") {
                // TRON balance check
                try {
                    const privateKey = this.encryptionService.decryptData(
                        app.TronWalletMnemonic.privateKey
                    );

                    // Check if native TRX or TRC20 token
                    if (token.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ||
                        token.symbol === "TRX") {
                        // Native TRX balance
                        balanceNum = await getTronBalance(walletAddress);
                    } else {
                        // TRC20 token balance
                        const tokenBalances = await getTRC20Balance([token], privateKey);
                        if (tokenBalances && tokenBalances.length > 0) {
                            balanceNum = parseFloat(tokenBalances[0].balance || "0");
                        } else {
                            balanceNum = 0;
                        }
                    }
                } catch (e) {
                    console.error("Error checking TRON balance:", e);
                    return { sufficient: false, balance: "0", required: amount };
                }
            } else if (chainId === "BTC") {
                // BTC balance check using Tatum API
                try {
                    const axios = require("axios");
                    const { ConfigService } = require("src/config/config.service");

                    const tatumApiKey = ConfigService.keys.TATUM_X_API_KEY;
                    const tatumNetwork = ConfigService.keys.TATUM_NETWORK || "bitcoin-testnet";

                    // Tatum API base URL depends on network
                    const baseUrl = tatumNetwork === "bitcoin-mainnet"
                        ? "https://api.tatum.io/v3/bitcoin"
                        : "https://api.tatum.io/v3/bitcoin";

                    console.log(`BTC Balance Check via Tatum - Address: ${walletAddress}, Network: ${tatumNetwork}`);

                    // Get balance using Tatum API
                    const response = await axios.get(
                        `${baseUrl}/address/balance/${walletAddress}`,
                        {
                            headers: {
                                "x-api-key": tatumApiKey,
                            },
                            timeout: 10000,
                        }
                    );

                    // Tatum returns balance in BTC directly
                    // Response: { incoming: "0.001", outgoing: "0" }
                    if (response.data) {
                        const incoming = parseFloat(response.data.incoming || "0");
                        const outgoing = parseFloat(response.data.outgoing || "0");
                        balanceNum = incoming - outgoing;
                        console.log(`BTC Balance: ${balanceNum} BTC (incoming: ${incoming}, outgoing: ${outgoing})`);
                    } else {
                        balanceNum = 0;
                    }
                } catch (e) {
                    console.error("Error checking BTC balance via Tatum:", e?.response?.data || e?.message || e);
                    return { sufficient: false, balance: "0", required: amount };
                }
            } else {
                return { sufficient: false, balance: "0", required: amount };
            }

            const sufficient = balanceNum >= amountNum;

            return {
                sufficient,
                balance: balanceNum.toFixed(8),
                required: amount,
            };
        } catch (error) {
            console.error("Error checking chain balance:", error);
            // If any error occurs, assume insufficient to be safe
            return { sufficient: false, balance: "0", required: amount };
        }
    }

    /**
     * Create a new withdrawal request
     */
    async createWithdrawalRequest(dto: CreateWithdrawalRequestDto, app: any) {
        try {
            const {
                userId,
                userEmail,
                userName,
                amount,
                code,
                walletAddress,
                externalReference,
                note,
            } = dto;

            // Use the authenticated app ID if available, otherwise check DTO (compatibility)
            const appId = app ? app._id : dto.appId;

            if (!appId) {
                throw new BadRequestException("App ID is required");
            }

            // Verify app exists and withdrawals are enabled
            // If app is passed in, we can use it directly, but let's re-fetch or use it
            let foundApp = app;
            if (!foundApp) {
                foundApp = await this.appsModel.findById(appId);
                if (!foundApp) {
                    throw new NotFoundException("App not found");
                }
            }

            if (!foundApp.isUserWithdrawalEnabled) {
                throw new BadRequestException(
                    "User withdrawals are disabled for this app"
                );
            }

            // Verify token exists by code
            const token = await this.tokenModel.findOne({ code });
            if (!token) {
                throw new NotFoundException(`Token with code ${code} not found`);
            }

            // Convert amount to USD for limit checking (simplified - in production use real price feed)
            // For now, assume 1:1 for stablecoins, or you can integrate with CoinGecko
            const amountNum = parseFloat(amount);
            const amountInUsd = amountNum; // Simplified - should use actual price conversion

            // Check minimum withdrawal amount
            if (foundApp.minWithdrawalAmount > 0 && amountInUsd < foundApp.minWithdrawalAmount) {
                throw new BadRequestException(
                    `Minimum withdrawal amount is ${foundApp.minWithdrawalAmount} USD`
                );
            }

            // Check cooldown
            const cooldownCheck = await this.checkCooldown(appId, userId);
            if (!cooldownCheck.allowed) {
                throw new BadRequestException(cooldownCheck.reason);
            }

            // Check daily limits
            const limitsCheck = await this.checkDailyLimits(appId, userId, amountInUsd);
            if (!limitsCheck.allowed) {
                throw new BadRequestException(limitsCheck.reason);
            }

            // Determine if auto-approval applies (amount check)
            let shouldAutoApprove =
                foundApp.isAutoWithdrawalEnabled &&
                foundApp.maxAutoWithdrawalLimit > 0 &&
                amountInUsd <= foundApp.maxAutoWithdrawalLimit;

            // If auto-approval criteria met, also check if wallet has sufficient balance
            let insufficientFundsAtCreation = false;
            if (shouldAutoApprove) {
                const balanceCheck = await this.checkChainBalance(foundApp, token, amount);
                if (!balanceCheck.sufficient) {
                    console.log(`Auto-approval blocked: Insufficient funds. Balance: ${balanceCheck.balance}, Required: ${balanceCheck.required}`);
                    shouldAutoApprove = false;
                    insufficientFundsAtCreation = true;
                }
            }

            // Create the withdrawal record
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
                    ? UserWithdrawalStatus.AUTO_APPROVED
                    : UserWithdrawalStatus.PENDING,
            });

            await withdrawal.save();

            // Send webhook for the initial status
            const webhookEvent = shouldAutoApprove
                ? WebhookEvent.WITHDRAWAL_AUTO_APPROVED
                : WebhookEvent.WITHDRAWAL_PENDING;

            await this.sendWithdrawalWebhook(
                withdrawal._id.toString(),
                webhookEvent,
                withdrawal
            );

            // If auto-approved, process immediately
            if (shouldAutoApprove) {
                // Process in background to not block the response
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
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }
            console.error("Error creating withdrawal request:", error);
            throw new BadRequestException(error.message);
        }
    }

    /**
     * List withdrawals with filters
     */
    async listWithdrawals(dto: ListWithdrawalsDto, merchantId?: string) {
        try {
            const { appId, status, userId, pageNo = 1, limitVal = 10, startDate, endDate } = dto;

            const query: any = { appsId: appId };

            // If merchantId is provided, verify access
            if (merchantId) {
                const app = await this.appsModel.findById(appId);
                if (!app || app.merchantId.toString() !== merchantId.toString()) {
                    throw new NotFoundException("App not found or unauthorized");
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
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error("Error listing withdrawals:", error);
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Approve a withdrawal request
     */
    async approveWithdrawal(dto: ApproveWithdrawalDto, merchantId?: string) {
        try {
            const { withdrawalId, note } = dto;

            const withdrawal = await this.userWithdrawalModel.findById(withdrawalId);
            if (!withdrawal) {
                throw new NotFoundException("Withdrawal not found");
            }

            // Verify merchant access if provided
            if (
                merchantId &&
                withdrawal.merchantId.toString() !== merchantId.toString()
            ) {
                throw new NotFoundException("Withdrawal not found or unauthorized");
            }

            // Can only approve PENDING withdrawals
            if (withdrawal.status !== UserWithdrawalStatus.PENDING) {
                throw new BadRequestException(
                    `Cannot approve withdrawal with status: ${withdrawal.status}`
                );
            }

            // Update status to APPROVED
            withdrawal.status = UserWithdrawalStatus.APPROVED;
            withdrawal.merchantApprovedAt = new Date();
            if (note) {
                withdrawal.note = note;
            }
            await withdrawal.save();

            // Send webhook
            await this.sendWithdrawalWebhook(
                withdrawalId,
                WebhookEvent.WITHDRAWAL_APPROVED,
                withdrawal
            );

            // Process the withdrawal
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
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }
            console.error("Error approving withdrawal:", error);
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Decline a withdrawal request
     */
    async declineWithdrawal(dto: DeclineWithdrawalDto, merchantId?: string) {
        try {
            const { withdrawalId, reason } = dto;

            const withdrawal = await this.userWithdrawalModel.findById(withdrawalId);
            if (!withdrawal) {
                throw new NotFoundException("Withdrawal not found");
            }

            // Verify merchant access if provided
            if (
                merchantId &&
                withdrawal.merchantId.toString() !== merchantId.toString()
            ) {
                throw new NotFoundException("Withdrawal not found or unauthorized");
            }

            // Can only decline PENDING withdrawals
            if (withdrawal.status !== UserWithdrawalStatus.PENDING) {
                throw new BadRequestException(
                    `Cannot decline withdrawal with status: ${withdrawal.status}`
                );
            }

            // Update status to DECLINED
            withdrawal.status = UserWithdrawalStatus.DECLINED;
            withdrawal.declineReason = reason;
            await withdrawal.save();

            // Send webhook
            await this.sendWithdrawalWebhook(
                withdrawalId,
                WebhookEvent.WITHDRAWAL_DECLINED,
                withdrawal
            );

            return {
                success: true,
                message: "Withdrawal declined",
                data: {
                    _id: withdrawal._id,
                    status: withdrawal.status,
                    declineReason: reason,
                },
            };
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }
            console.error("Error declining withdrawal:", error);
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Process an approved withdrawal - execute the blockchain transfer
     */
    async processWithdrawal(withdrawalId: string) {
        const withdrawal = await this.userWithdrawalModel.findById(withdrawalId);
        if (!withdrawal) {
            throw new NotFoundException("Withdrawal not found");
        }

        // Only process APPROVED or AUTO_APPROVED withdrawals
        if (
            withdrawal.status !== UserWithdrawalStatus.APPROVED &&
            withdrawal.status !== UserWithdrawalStatus.AUTO_APPROVED
        ) {
            throw new BadRequestException(
                `Cannot process withdrawal with status: ${withdrawal.status}`
            );
        }

        // Update status to PROCESSING
        withdrawal.status = UserWithdrawalStatus.PROCESSING;
        await withdrawal.save();

        // Send processing webhook
        await this.sendWithdrawalWebhook(
            withdrawalId,
            WebhookEvent.WITHDRAWAL_PROCESSING,
            withdrawal
        );

        try {
            // Get app and token details
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

            let receipt: any;
            const chainId = token.chainId;

            // Determine which chain and execute transfer
            if (chainId === "TRON") {
                // TRON transfer
                const privateKey = this.encryptionService.decryptData(
                    app.TronWalletMnemonic.privateKey
                );
                receipt = await merchantTronFundWithdraw(
                    privateKey,
                    token.address,
                    withdrawal.amount,
                    withdrawal.walletAddress,
                    token.decimal
                );
            } else if (chainId === "BTC") {
                // Bitcoin transfer
                const privateKey = this.encryptionService.decryptData(
                    app.BtcWalletMnemonic.privateKey
                );
                receipt = await merchantBtcFundWithdraw(
                    privateKey,
                    parseFloat(withdrawal.amount),
                    withdrawal.walletAddress,
                    app.BtcWalletMnemonic.address,
                    0,
                    ""
                );
            } else {
                // EVM chains (ETH, BSC, Polygon, etc.)
                const privateKey = this.encryptionService.decryptData(
                    app.EVMWalletMnemonic.privateKey
                );
                receipt = await merchantEvmFundWithdraw(
                    chainId,
                    privateKey,
                    token.address,
                    parseFloat(withdrawal.amount),
                    withdrawal.walletAddress,
                    token.decimal,
                    null // No swap
                );
            }

            // Check result
            if (receipt?.status === false || receipt?.error) {
                throw new Error(receipt?.error || "Transaction failed");
            }

            // Update withdrawal as successful
            withdrawal.status = UserWithdrawalStatus.SUCCESS;
            withdrawal.txHash = receipt?.data?.transactionHash || receipt?.txid || "";
            withdrawal.processedAt = new Date();
            await withdrawal.save();

            // Send success webhook
            await this.sendWithdrawalWebhook(
                withdrawalId,
                WebhookEvent.WITHDRAWAL_SUCCESS,
                withdrawal
            );

            // Send email notification to merchant
            await this.sendWithdrawalEmail(withdrawal, "success");

            return {
                success: true,
                txHash: withdrawal.txHash,
            };
        } catch (error) {
            console.error("Error processing withdrawal:", error);

            // Update withdrawal as failed
            withdrawal.status = UserWithdrawalStatus.FAILED;
            withdrawal.failureReason = error.message;
            await withdrawal.save();

            // Send failure webhook
            await this.sendWithdrawalWebhook(
                withdrawalId,
                WebhookEvent.WITHDRAWAL_FAILED,
                withdrawal
            );

            // Send email notification to merchant
            await this.sendWithdrawalEmail(withdrawal, "failed");

            throw error;
        }
    }

    /**
     * Get wallet balance for an app
     */
    async getWalletBalance(appId: string) {
        try {
            const app = await this.appsModel.findById(appId);
            if (!app) {
                throw new NotFoundException("App not found");
            }

            // Get all supported tokens
            const tokens = await this.tokenModel.find();


            // Fetch balances for each token
            const balances = await Promise.all(
                tokens.map(async (token) => {
                    const chainId = token.chainId;
                    let walletAddress = "";
                    let balance = "N/A";

                    // Get wallet address based on chain
                    if (chainId === "TRON") {
                        walletAddress = app.TronWalletMnemonic?.address || "";
                    } else if (chainId === "BTC") {
                        walletAddress = app.BtcWalletMnemonic?.address || "";
                    } else {
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
                        // EVM chains
                        if (chainId !== "TRON" && chainId !== "BTC") {
                            const network = getNetwork(chainId);
                            const balanceRaw = await evmCryptoBalanceCheck(
                                network.rpc,
                                token.address,
                                walletAddress
                            );
                            const decimal = token.decimal || 18;
                            const balanceNum = parseFloat(balanceRaw?.toString() || "0") / Math.pow(10, decimal);
                            balance = balanceNum.toFixed(6);
                        }
                        // TRON chain
                        else if (chainId === "TRON") {
                            if (token.symbol === "TRX") {
                                const trxBalance = await getTronBalance(walletAddress);
                                balance = trxBalance.toFixed(6);
                            } else {
                                const privateKey = this.encryptionService.decryptData(
                                    app.TronWalletMnemonic.privateKey
                                );
                                const tokenBalances = await getTRC20Balance([token], privateKey);
                                if (tokenBalances && tokenBalances.length > 0) {
                                    balance = parseFloat(tokenBalances[0].balance || "0").toFixed(6);
                                }
                            }
                        }
                        // BTC chain via Tatum
                        else if (chainId === "BTC") {
                            const tatumApiKey = ConfigService.keys.TATUM_X_API_KEY;
                            const response = await axios.get(
                                `https://api.tatum.io/v3/bitcoin/address/balance/${walletAddress}`,
                                {
                                    headers: { "x-api-key": tatumApiKey },
                                    timeout: 10000,
                                }
                            );
                            if (response.data) {
                                const incoming = parseFloat(response.data.incoming || "0");
                                const outgoing = parseFloat(response.data.outgoing || "0");
                                balance = (incoming - outgoing).toFixed(8);
                            }
                        }
                    } catch (e) {
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
                })
            );

            return {
                success: true,
                data: {
                    appId,
                    balances,
                },
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error("Error getting wallet balance:", error);
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Get withdrawal status by ID
     */
    async getWithdrawalStatus(withdrawalId: string, merchantId?: string) {
        const withdrawal = await this.userWithdrawalModel.findById(withdrawalId);
        if (!withdrawal) {
            throw new NotFoundException("Withdrawal not found");
        }

        if (merchantId && withdrawal.merchantId.toString() !== merchantId.toString()) {
            throw new NotFoundException("Withdrawal not found or unauthorized");
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

    /**
     * Update withdrawal settings for an app
     */
    async updateWithdrawalSettings(dto: UpdateWithdrawalSettingsDto, merchantId: string) {
        try {
            const { appId, ...settings } = dto;

            const app = await this.appsModel.findOne({
                _id: appId,
                merchantId,
            });

            if (!app) {
                throw new NotFoundException("App not found or unauthorized");
            }

            // Update only provided settings
            const updateData: any = {};
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
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error("Error updating withdrawal settings:", error);
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Send webhook for withdrawal events
     */
    private async sendWithdrawalWebhook(
        withdrawalId: string,
        event: WebhookEvent,
        withdrawal: UserWithdrawalDocument
    ) {
        try {
            // Build enhanced payload with user data
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

            await this.webhookService.sendWebhook(
                withdrawal.appsId.toString(),
                withdrawalId,
                event,
                payload
            );
        } catch (error) {
            console.error("Error sending withdrawal webhook:", error);
            // Don't throw - webhook failure shouldn't block the withdrawal process
        }
    }

    /**
     * Send email notification to merchant for withdrawal events
     */
    private async sendWithdrawalEmail(
        withdrawal: UserWithdrawalDocument,
        status: "success" | "failed"
    ) {
        try {
            const merchant = await this.merchantModel.findById(withdrawal.merchantId);
            if (!merchant?.email) {
                return;
            }

            // TODO: Implement email sending using existing email service
            // For now, just log the email that would be sent
            console.log(`[Email] Would send ${status} withdrawal email to ${merchant.email}`, {
                withdrawalId: withdrawal._id,
                amount: withdrawal.amount,
                tokenSymbol: withdrawal.tokenSymbol,
                status,
            });
        } catch (error) {
            console.error("Error sending withdrawal email:", error);
            // Don't throw - email failure shouldn't block the withdrawal process
        }
    }

    /**
     * Get withdrawal history (for merchant dashboard)
     */
    async getWithdrawalHistory(
        merchantId: string,
        query: { pageNo?: number; limitVal?: number; status?: string }
    ) {
        try {
            const { pageNo = 1, limitVal = 10, status } = query;

            // Get all apps for this merchant
            const apps = await this.appsModel.find({ merchantId });
            const appIds = apps.map((app) => app._id);

            const queryObj: any = { appsId: { $in: appIds } };

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
        } catch (error) {
            console.error("Error getting withdrawal history:", error);
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Admin list all withdrawals across all merchants
     */
    async adminListWithdrawals(query: {
        pageNo?: number;
        limitVal?: number;
        status?: string;
        merchantId?: string;
        search?: string;
    }) {
        try {
            const { pageNo = 1, limitVal = 10, status, merchantId, search } = query;

            const queryObj: any = {};

            // Filter by status
            if (status) {
                queryObj.status = status;
            }

            // Filter by merchant
            if (merchantId) {
                queryObj.merchantId = merchantId;
            }

            // Search by userId or userEmail or walletAddress
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
        } catch (error) {
            console.error("Error getting admin withdrawals:", error);
            throw new BadRequestException(error.message);
        }
    }
}

