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
exports.PaymentLinkService = void 0;
const index_1 = require("./../constants/index");
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const payment_link_schema_1 = require("./schema/payment-link.schema");
const mongoose_2 = require("mongoose");
const apps_schema_1 = require("../apps/schema/apps.schema");
const encryption_service_1 = require("../utils/encryption.service");
const evm_helper_1 = require("../helpers/evm.helper");
const moment_1 = __importDefault(require("moment"));
const moralis_1 = __importDefault(require("moralis"));
const common_evm_utils_1 = require("@moralisweb3/common-evm-utils");
const wallet_monitor_schema_1 = require("../wallet-monitor/schema/wallet-monitor.schema");
const wallet_monitor_enum_1 = require("../wallet-monitor/schema/wallet-monitor.enum");
const token_schema_1 = require("../token/schema/token.schema");
const config_service_1 = require("../config/config.service");
const merchant_app_tx_schema_1 = require("../merchant-app-tx/schema/merchant-app-tx.schema");
const payment_enum_1 = require("./schema/payment.enum");
const admin_service_1 = require("../admin/admin.service");
const tron_helper_1 = require("../helpers/tron.helper");
const bitcoin_helper_1 = require("../helpers/bitcoin.helper");
const helper_1 = require("../helpers/helper");
const constants_1 = require("../constants");
const enum_1 = require("../merchant-app-tx/schema/enum");
const axios_1 = __importDefault(require("axios"));
const webhook_service_1 = require("../webhook/webhook.service");
const webhook_log_schema_1 = require("../webhook/schema/webhook-log.schema");
let PaymentLinkService = class PaymentLinkService {
    constructor(paymentLinkModel, appsModel, monitorModel, tokenModel, encryptionService, merchantAppTxModel, adminService, webhookService) {
        this.paymentLinkModel = paymentLinkModel;
        this.appsModel = appsModel;
        this.monitorModel = monitorModel;
        this.tokenModel = tokenModel;
        this.encryptionService = encryptionService;
        this.merchantAppTxModel = merchantAppTxModel;
        this.adminService = adminService;
        this.webhookService = webhookService;
    }
    getCoinIdFromCode(code) {
        const baseCode = code.split(".")[0]?.toUpperCase();
        const mapping = {
            USDT: "tether",
            USDC: "usd-coin",
            WBNB: "wbnb",
            BTC: "bitcoin",
            BNB: "binancecoin",
            TRX: "tron",
            ETH: "ethereum",
            MATIC: "polygon-ecosystem-token",
        };
        return mapping[baseCode] || null;
    }
    async addPaymentLink(dto, clientIp) {
        try {
            const { appId, apiKey, secretKey, code, amount, buyerEmail, buyerName, itemName, itemNumber, invoice, custom, successUrl, cancelUrl, transactionType, fiatCurrency, } = dto;
            const coinId = this.getCoinIdFromCode(code);
            if (transactionType === payment_enum_1.TransactionType.FIAT) {
                if (!fiatCurrency) {
                    throw new common_1.NotFoundException("fiatCurrency is required for FIAT transactions");
                }
                if (!coinId) {
                    throw new common_1.NotFoundException("Unable to detect coinId from provided code");
                }
            }
            else if (transactionType !== payment_enum_1.TransactionType.CRYPTO) {
                throw new common_1.NotFoundException("Invalid transaction type");
            }
            const app = await this.appsModel.findOne({
                _id: appId,
            });
            if (!app) {
                throw new common_1.NotFoundException("Invalid app");
            }
            const merchant = await this.appsModel.findById(appId).populate('merchantId');
            const merchantData = merchant?.merchantId;
            if (merchantData?.isIPWhitelistEnabled && merchantData?.whitelistedIPs && merchantData.whitelistedIPs.length > 0 && clientIp) {
                let normalizedClientIp = clientIp.replace(/^::ffff:/, '');
                if (normalizedClientIp === '::1' || normalizedClientIp === '127.0.0.1') {
                    normalizedClientIp = '127.0.0.1';
                }
                const isWhitelisted = merchantData.whitelistedIPs.some((whitelistedIp) => {
                    const normalizedWhitelistedIp = whitelistedIp === '::1' ? '127.0.0.1' : whitelistedIp;
                    return normalizedWhitelistedIp === normalizedClientIp || whitelistedIp === clientIp;
                });
                if (!isWhitelisted) {
                    throw new common_1.ForbiddenException(`Access denied. IP address ${normalizedClientIp} is not whitelisted.`);
                }
            }
            const token = await this.tokenModel.findOne({
                code: code,
            });
            if (!token) {
                throw new common_1.NotFoundException("Invalid token code");
            }
            if (token.minDeposit > parseFloat(amount)) {
                throw new common_1.NotFoundException(`For ${token?.network} network ${token?.code} min deposit value is ${token?.minDeposit}`);
            }
            const publicKey = this.encryptionService.decryptData(app?.API_KEY);
            const privateKey = this.encryptionService.decryptData(app?.SECRET_KEY);
            if (apiKey !== publicKey) {
                throw new common_1.NotFoundException(" Api Key not found");
            }
            if (secretKey !== privateKey) {
                throw new common_1.NotFoundException("Secret Key not found");
            }
            let cryptoAmount = null;
            let price = null;
            let cryptoUsd = null;
            let fiatUsd = null;
            if (transactionType === payment_enum_1.TransactionType.FIAT) {
                const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${fiatCurrency}`;
                console.log("urll", url);
                const response = await axios_1.default.get(url);
                console.log("response", response);
                if (!response.data[coinId] || !response.data[coinId][fiatCurrency]) {
                    throw new common_1.BadRequestException("Invalid fiatCurrency");
                }
                price = response.data[coinId][fiatCurrency];
                console.log("price", price);
                cryptoAmount = Number(amount) / price;
                const cryptoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
                const r = await axios_1.default.get(cryptoUrl);
                const pricePer = r.data[coinId].usd;
                cryptoUsd = cryptoAmount * pricePer;
                if (fiatCurrency.toUpperCase() === "USD") {
                    fiatUsd = Number(amount);
                }
                else {
                    const fiatUrl = `https://api.frankfurter.app/latest?amount=${amount}&from=${fiatCurrency}&to=USD`;
                    const re = await axios_1.default.get(fiatUrl);
                    const usdPrice = re.data;
                    fiatUsd = usdPrice?.rates?.USD;
                    console.log("fiatUsd", fiatUsd);
                }
            }
            const model = await new this.paymentLinkModel();
            model.appId = appId;
            model.code = code;
            model.buyerEmail = buyerEmail;
            model.expireTime = (0, moment_1.default)().add(1, "hours").unix();
            model.buyerName = buyerName;
            model.itemName = itemName;
            model.itemNumber = itemNumber;
            model.invoice = invoice;
            model.custom = custom;
            model.linkURL = `${config_service_1.ConfigService.keys.WEB_BASE_URL}payment-information/${model._id}`;
            model.successUrl = successUrl;
            model.cancelUrl = cancelUrl;
            model.tokenAddress = token.address;
            model.chainId = token?.chainId;
            model.symbol = token?.symbol;
            model.tokenDecimals = token?.decimal.toString();
            model.transactionType = transactionType;
            if (transactionType === payment_enum_1.TransactionType.FIAT) {
                model.fiatCurrency = fiatCurrency;
                model.coinId = coinId;
                model.fiatAmount = amount;
                model.cryptoAmount = cryptoAmount.toFixed(6);
                model.pricePerCoin = price;
                model.amount = cryptoAmount.toFixed(6);
                model.cryptoToUsd = cryptoUsd.toFixed(6);
                model.fiatToUsd = fiatUsd.toFixed(6);
            }
            else {
                model.amount = amount;
                model.fiatCurrency = undefined;
                model.coinId = undefined;
                model.cryptoAmount = undefined;
                model.pricePerCoin = undefined;
                model.fiatAmount = undefined;
                model.cryptoToUsd = undefined;
                model.fiatToUsd = undefined;
            }
            const mnemonic = this.encryptionService.decryptData(app?.EVMWalletMnemonic?.mnemonic?.phrase);
            let indexVal;
            let walletInfo;
            if (token?.network.toUpperCase() === "TRON") {
                indexVal = app?.tronCurrentIndexVal;
                walletInfo = await (0, tron_helper_1.generateTronWallet)(mnemonic, indexVal + 1);
                app.tronCurrentIndexVal = app?.tronCurrentIndexVal + 1;
                model.tokenDecimals = token?.decimal.toString();
            }
            else if (token?.network.toUpperCase() === "BITCOIN") {
                indexVal = app?.btcCurrentIndexVal;
                walletInfo = await (0, bitcoin_helper_1.generateBitcoinWallet)(mnemonic, indexVal + 1);
                app.btcCurrentIndexVal = app?.btcCurrentIndexVal + 1;
            }
            else {
                indexVal = app?.currentIndexVal;
                walletInfo = await (0, evm_helper_1.generateEvmWallet)(mnemonic, indexVal + 1);
                app.currentIndexVal = app?.currentIndexVal + 1;
            }
            if (!walletInfo) {
                throw new common_1.NotAcceptableException("Error in generating wallet");
            }
            model.toAddress = walletInfo?.address;
            model.privateKey = this.encryptionService.encryptData(walletInfo?.privateKey);
            const result = await model.save();
            if (result) {
                await app.save();
            }
            if (token?.network.toUpperCase() !== "TRON" &&
                token?.network?.toUpperCase() !== "BITCOIN") {
                const streamData = {
                    id: config_service_1.ConfigService.keys.WEB_STREAMER_ID,
                    address: walletInfo?.address,
                };
                await moralis_1.default.Streams.addAddress(streamData);
            }
            const wallet = await new this.monitorModel();
            wallet.paymentLinkId = model?._id;
            wallet.walletAddress = model?.toAddress;
            wallet.tokenAddress = token?.address;
            wallet.chainId = token?.chainId;
            wallet.expiryTime = model.expireTime;
            wallet.transactionType = model.transactionType;
            wallet.walletType = wallet_monitor_enum_1.WalletType.PAYMENT_LINK;
            wallet.isExpiry = true;
            wallet.streamId =
                token?.chainId.toUpperCase() === "BTC"
                    ? ""
                    : config_service_1.ConfigService.keys.WEB_STREAMER_ID;
            if (transactionType === payment_enum_1.TransactionType.FIAT) {
                wallet.amount = cryptoAmount.toFixed(6);
            }
            else {
                wallet.amount = amount;
            }
            await wallet.save();
            await this.webhookService.sendWebhook(appId, model._id.toString(), webhook_log_schema_1.WebhookEvent.PAYMENT_INITIATED, {
                ...model.toObject(),
                status: payment_enum_1.PaymentStatus.PENDING,
            });
            return {
                message: "Payment link created successfully",
                link: model,
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
    async getWalletERC20Transactions(query) {
        try {
            const { paymentId } = query;
            const payment = await this.paymentLinkModel.findById(paymentId);
            if (!payment) {
                throw new common_1.NotFoundException("Invalid payment Id");
            }
            const address = payment?.toAddress;
            const amount = payment?.amount;
            const Amount = common_evm_utils_1.EvmNative.create(amount);
            const response = await moralis_1.default.EvmApi.token.getWalletTokenTransfers({
                chain: payment?.chainId,
                address: payment.toAddress,
                contractAddresses: [payment?.tokenAddress],
            });
            let tx = null;
            let data = (await response?.result) ?? [];
            const newData = data[0]?.toJSON();
            return response;
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
    async getMerchantTransactions(query, user) {
        try {
            const { appId, pageNo, limitVal, search, symbol, chainId, startDate, endDate, } = query;
            const apps = await this.appsModel.find({
                merchantId: user.userId,
            });
            if (apps.length === 0) {
                throw new common_1.NotFoundException("Apps not found.");
            }
            const appIds = apps.map((app) => app._id);
            console.log("appIds", appIds);
            const page = pageNo ? parseInt(pageNo) : 1;
            const limit = limitVal ? parseInt(limitVal) : 10;
            let queryObject = {};
            if (appId) {
                queryObject.appId = appId;
            }
            else {
                queryObject.appId = { $in: appIds };
            }
            if (search) {
                queryObject = {
                    $or: [
                        { tokenSymbol: { $regex: search, $options: "i" } },
                        { fromAddress: { $regex: search, $options: "i" } },
                        { toAddress: { $regex: search, $options: "i" } },
                        { symbol: { $regex: symbol, $options: "i" } },
                    ],
                };
            }
            else if (symbol === "ALL") {
                queryObject = {
                    appId: { $in: appIds },
                };
            }
            else if (symbol) {
                queryObject = {
                    symbol: { $regex: symbol, $options: "i" },
                    appId: { $in: appIds },
                };
            }
            else if (chainId) {
                queryObject = {
                    chainId: { $regex: chainId, $options: "i" },
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
            const transactions = await this.paymentLinkModel
                .find(queryObject)
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ _id: -1 });
            const count = await this.paymentLinkModel.countDocuments(queryObject);
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
    async getMerchantTransactionById(query) {
        try {
            const { transactionId } = query;
            if (!transactionId) {
                throw new common_1.BadRequestException("Transaction ID is required");
            }
            const transaction = await this.paymentLinkModel.findById(transactionId);
            if (!transaction) {
                throw new common_1.BadRequestException("Invalid Id");
            }
            return { success: true, data: transaction };
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
    async getAllPaymentLinks(query, user) {
        try {
            const { pageNo, limitVal, search } = query;
            if (!user.isAdmin) {
                throw new common_1.ForbiddenException("Unauthorized access");
            }
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
                        { status: search },
                        { tokenSymbol: { $regex: search, $options: "i" } },
                    ],
                };
            }
            const transactions = await this.paymentLinkModel
                .find(queryObject)
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ _id: -1 });
            const count = await this.paymentLinkModel.countDocuments(queryObject);
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
    async getPaymentLinksById(query) {
        try {
            const { paymentId } = query;
            const paymentLink = await this.paymentLinkModel.findById(paymentId);
            if (!paymentLink || !paymentId) {
                throw new common_1.NotFoundException("Payment link or id not found");
            }
            const app = await this.appsModel.findById(paymentLink.appId);
            const paymentLinkObj = paymentLink.toObject();
            if (app && app.logo) {
                paymentLinkObj['logo'] = app.logo.replace(/\\/g, "/");
            }
            if (app && app.theme) {
                paymentLinkObj['theme'] = app.theme;
            }
            return {
                data: paymentLinkObj,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException("Unable to retrieve payment link");
            }
        }
    }
    async count(query) {
        try {
            const { timePeriod } = query;
            const total = await this.paymentLinkModel.countDocuments({
                status: payment_enum_1.PaymentStatus.SUCCESS,
            });
            const currentYear = new Date().getFullYear();
            const lastFourYears = Array.from({ length: 4 }, (_, i) => currentYear - i);
            const tokenCounts = await this.paymentLinkModel.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
                            $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
                        },
                        status: payment_enum_1.PaymentStatus.SUCCESS,
                    },
                },
                {
                    $group: {
                        _id: "$code",
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1 } },
            ]);
            const top5Tokens = tokenCounts.slice(0, 5).map((token) => token._id);
            let timePeriodArray;
            let timePeriods;
            let monthlyCounts;
            if (timePeriod === constants_1.TIME_PERIOD.MONTHLY) {
                timePeriodArray = [
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                ];
                timePeriods = Array.from({ length: 12 }, (_, i) => i + 1);
                monthlyCounts = await this.paymentLinkModel.aggregate([
                    {
                        $match: {
                            code: { $in: top5Tokens },
                            createdAt: {
                                $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
                                $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
                            },
                            status: payment_enum_1.PaymentStatus.SUCCESS,
                        },
                    },
                    {
                        $project: {
                            code: 1,
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" },
                        },
                    },
                    {
                        $group: {
                            _id: { code: "$code", year: "$year", month: "$month" },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { "_id.code": 1, "_id.year": 1, "_id.month": 1 } },
                ]);
            }
            else if (timePeriod === constants_1.TIME_PERIOD.QUARTERLY) {
                timePeriodArray = ["Jan - Mar", "Apr - Jun", "Jul - Sep", "Oct - Dec"];
                timePeriods = [1, 2, 3, 4];
                monthlyCounts = await this.paymentLinkModel.aggregate([
                    {
                        $match: {
                            code: { $in: top5Tokens },
                            createdAt: {
                                $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
                                $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
                            },
                            status: payment_enum_1.PaymentStatus.SUCCESS,
                        },
                    },
                    {
                        $project: {
                            code: 1,
                            year: { $year: "$createdAt" },
                            quarter: {
                                $switch: {
                                    branches: [
                                        { case: { $lte: [{ $month: "$createdAt" }, 3] }, then: 1 },
                                        { case: { $lte: [{ $month: "$createdAt" }, 6] }, then: 2 },
                                        { case: { $lte: [{ $month: "$createdAt" }, 9] }, then: 3 },
                                    ],
                                    default: 4,
                                },
                            },
                        },
                    },
                    {
                        $group: {
                            _id: { code: "$code", year: "$year", quarter: "$quarter" },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { "_id.code": 1, "_id.year": 1, "_id.quarter": 1 } },
                ]);
            }
            else if (timePeriod === constants_1.TIME_PERIOD.ANNUALLY) {
                timePeriodArray = lastFourYears;
                timePeriods = lastFourYears;
                monthlyCounts = await this.paymentLinkModel.aggregate([
                    {
                        $match: {
                            code: { $in: top5Tokens },
                            createdAt: {
                                $gte: new Date(`${lastFourYears[3]}-01-01T00:00:00.000Z`),
                                $lte: new Date(`${lastFourYears[0]}-12-31T23:59:59.999Z`),
                            },
                            status: payment_enum_1.PaymentStatus.SUCCESS,
                        },
                    },
                    {
                        $project: {
                            code: 1,
                            year: { $year: "$createdAt" },
                        },
                    },
                    {
                        $group: {
                            _id: { code: "$code", year: "$year" },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { "_id.code": 1, "_id.year": 1 } },
                ]);
            }
            else {
                throw new common_1.BadRequestException("Invalid time period");
            }
            const completeResponse = top5Tokens.flatMap((token) => timePeriods.map((period) => {
                const found = monthlyCounts.find((item) => item._id.code === token &&
                    (timePeriod === constants_1.TIME_PERIOD.ANNUALLY
                        ? item._id.year === period
                        : timePeriod === constants_1.TIME_PERIOD.QUARTERLY
                            ? item._id.quarter === period
                            : item._id.month === period));
                return (found || {
                    _id: {
                        code: token,
                        year: currentYear,
                        ...(timePeriod === constants_1.TIME_PERIOD.ANNUALLY
                            ? { year: period }
                            : timePeriod === constants_1.TIME_PERIOD.QUARTERLY
                                ? { quarter: period }
                                : { month: period }),
                    },
                    count: 0,
                });
            }));
            return {
                message: "Payment link count",
                total,
                monthlyCounts: completeResponse,
                timePeriodArray,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException("Unable to retrieve payment link");
            }
        }
    }
    async revenue(query) {
        try {
            console.log("----------------------------------------------------------------RR");
            const { timePeriod, symbol } = query;
            const startOfYear = (0, moment_1.default)().startOf("year").toDate();
            const currentYear = (0, moment_1.default)().year();
            const response = {
                message: "Total deposits and paymentLinks calculated successfully",
                paymentLinks: [],
                merchant: [],
                periodNames: [],
            };
            let groupBy;
            let periods;
            if (timePeriod === constants_1.TIME_PERIOD.MONTHLY) {
                groupBy = { $month: "$createdAt" };
                periods = Array.from({ length: 12 }, (_, i) => (0, moment_1.default)().month(i).format("MMMM"));
                response.paymentLinks = Array.from({ length: 12 }, (_, i) => ({
                    month: i + 1,
                    total: 0,
                }));
                response.merchant = Array.from({ length: 12 }, (_, i) => ({
                    month: i + 1,
                    total: 0,
                }));
                response.periodNames = periods;
            }
            else if (timePeriod === constants_1.TIME_PERIOD.QUARTERLY) {
                groupBy = {
                    $switch: {
                        branches: [
                            { case: { $lte: [{ $month: "$createdAt" }, 3] }, then: 1 },
                            { case: { $lte: [{ $month: "$createdAt" }, 6] }, then: 2 },
                            { case: { $lte: [{ $month: "$createdAt" }, 9] }, then: 3 },
                            { case: { $lte: [{ $month: "$createdAt" }, 12] }, then: 4 },
                        ],
                        default: null,
                    },
                };
                periods = ["Jan - Mar", "Apr - Jun", "Jul - Sept", "Oct - Dec"];
                response.paymentLinks = Array.from({ length: 4 }, (_, i) => ({
                    quarter: i + 1,
                    total: 0,
                }));
                response.merchant = Array.from({ length: 4 }, (_, i) => ({
                    quarter: i + 1,
                    total: 0,
                }));
                response.periodNames = periods;
            }
            else if (timePeriod === constants_1.TIME_PERIOD.ANNUALLY) {
                groupBy = { $year: "$createdAt" };
                periods = [
                    currentYear.toString(),
                    (currentYear - 1).toString(),
                    (currentYear - 2).toString(),
                    (currentYear - 3).toString(),
                ];
                response.paymentLinks = Array.from({ length: 4 }, (_, i) => ({
                    year: currentYear - i,
                    total: 0,
                }));
                response.merchant = Array.from({ length: 4 }, (_, i) => ({
                    year: currentYear - i,
                    total: 0,
                }));
                response.periodNames = periods;
            }
            else {
                throw new common_1.BadRequestException("Invalid time period provided, must be MONTHLY, QUARTERLY or ANNUAL specified");
            }
            const paymentLinkData = await this.paymentLinkModel.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfYear },
                        symbol: symbol,
                        status: payment_enum_1.PaymentStatus.SUCCESS,
                    },
                },
                {
                    $group: {
                        _id: groupBy,
                        adminFee: { $sum: { $toDouble: "$adminFee" } },
                    },
                },
                {
                    $sort: { _id: 1 },
                },
            ]);
            console.log("  let groupBy;  let periods : ", groupBy, "p : ", periods);
            console.log("paymentLinkData ---------------------- : ", paymentLinkData);
            paymentLinkData.forEach((item) => {
                let index;
                if (timePeriod === constants_1.TIME_PERIOD.MONTHLY) {
                    index = item._id - 1;
                }
                else if (timePeriod === constants_1.TIME_PERIOD.QUARTERLY) {
                    index = item._id - 1;
                }
                else {
                    index = periods.indexOf(item._id.toString());
                }
                if (index >= 0) {
                    response.paymentLinks[index].total = item.adminFee;
                }
            });
            const merchantData = await this.merchantAppTxModel.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfYear },
                        symbol: symbol,
                        status: payment_enum_1.PaymentStatus.SUCCESS,
                        txType: enum_1.TransactionTypes.WITHDRAW,
                    },
                },
                {
                    $group: {
                        _id: groupBy,
                        totalReceivedAmount: { $sum: { $toDouble: "$adminFee" } },
                    },
                },
                {
                    $sort: { _id: 1 },
                },
            ]);
            merchantData.forEach((item) => {
                let index;
                if (timePeriod === constants_1.TIME_PERIOD.MONTHLY) {
                    index = item._id - 1;
                }
                else if (timePeriod === constants_1.TIME_PERIOD.QUARTERLY) {
                    index = item._id - 1;
                }
                else {
                    index = periods.indexOf(item._id.toString());
                }
                if (index >= 0) {
                    response.merchant[index].total = item.totalReceivedAmount;
                }
            });
            return response;
        }
        catch (error) {
            console.log("An error occurred:", error.message);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException("Unable to retrieve revenue data");
            }
        }
    }
    async cryptoMargins(query) {
        try {
            const { timePeriod } = query;
            const currentYear = new Date().getFullYear();
            const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);
            const endOfYear = new Date(`${currentYear}-12-31T23:59:59.999Z`);
            let groupBy;
            let periods;
            let periodNames;
            if (timePeriod === constants_1.TIME_PERIOD.MONTHLY) {
                groupBy = {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                    symbol: { $ifNull: ["$symbol", "Not Specified"] },
                };
                periods = Array.from({ length: 12 }, (_, i) => (0, moment_1.default)().month(i).format("MMMM"));
                periodNames = periods;
            }
            else if (timePeriod === constants_1.TIME_PERIOD.QUARTERLY) {
                groupBy = {
                    year: { $year: "$createdAt" },
                    quarter: { $ceil: { $divide: [{ $month: "$createdAt" }, 3] } },
                    symbol: { $ifNull: ["$symbol", "Not Specified"] },
                };
                periods = ["Jan - Mar", "Apr - Jun", "Jul - Sep", "Oct - Dec"];
                periodNames = periods;
            }
            else if (timePeriod === constants_1.TIME_PERIOD.ANNUALLY) {
                groupBy = {
                    year: { $year: "$createdAt" },
                    symbol: { $ifNull: ["$symbol", "Not Specified"] },
                };
                periods = [
                    currentYear.toString(),
                    (currentYear - 1).toString(),
                    (currentYear - 2).toString(),
                    (currentYear - 3).toString(),
                ];
                periodNames = periods;
            }
            else {
                throw new common_1.BadRequestException("Invalid time period");
            }
            const merchantAppTxMargins = await this.merchantAppTxModel.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: startOfYear,
                            $lte: endOfYear,
                        },
                        status: payment_enum_1.PaymentStatus.SUCCESS,
                    },
                },
                {
                    $group: {
                        _id: groupBy,
                        count: { $sum: 1 },
                    },
                },
                {
                    $sort: {
                        "_id.year": 1,
                        ...(timePeriod === constants_1.TIME_PERIOD.MONTHLY
                            ? { "_id.month": 1 }
                            : timePeriod === constants_1.TIME_PERIOD.QUARTERLY
                                ? { "_id.quarter": 1 }
                                : {}),
                    },
                },
            ]);
            const cryptoCounts = {};
            merchantAppTxMargins.forEach((doc) => {
                const symbol = doc._id.symbol || "Not Specified";
                if (!cryptoCounts[symbol]) {
                    cryptoCounts[symbol] = 0;
                }
                cryptoCounts[symbol] += doc.count;
            });
            const topCryptos = Object.entries(cryptoCounts)
                .sort(([, a], [_, b]) => b - a)
                .slice(0, 5)
                .map(([symbol]) => symbol);
            const result = periods.map((period) => {
                const tokenCounts = topCryptos.reduce((acc, symbol) => {
                    acc[symbol] = 0;
                    return acc;
                }, {});
                return {
                    period,
                    tokenCounts,
                    totalCounts: 0,
                };
            });
            merchantAppTxMargins.forEach((doc) => {
                if (topCryptos.includes(doc._id.symbol)) {
                    let periodName;
                    if (timePeriod === constants_1.TIME_PERIOD.MONTHLY) {
                        periodName = (0, moment_1.default)()
                            .month(doc._id.month - 1)
                            .format("MMMM");
                    }
                    else if (timePeriod === constants_1.TIME_PERIOD.QUARTERLY) {
                        const quarter = doc._id.quarter;
                        periodName = periodNames[quarter - 1];
                    }
                    else {
                        periodName = doc._id.year.toString();
                    }
                    const periodData = result.find((p) => p.period === periodName);
                    if (periodData) {
                        const symbol = doc._id.symbol || "Not Specified";
                        periodData.tokenCounts[symbol] += doc.count;
                        periodData.totalCounts += doc.count;
                    }
                }
            });
            const filteredResult = result.filter((periodData) => {
                const hasTokens = Object.values(periodData.tokenCounts).some((count) => count > 0);
                return hasTokens;
            });
            return {
                message: "Crypto margin calculated successfully",
                data: filteredResult,
                periodNames,
            };
        }
        catch (error) {
            console.log("An error occurred:", error.message);
            throw new common_1.BadRequestException("Unable to calculate crypto margin");
        }
    }
    async merchantDepositWithdrawals(query) {
        try {
            const { timePeriod, symbol } = query;
            const startOfYear = (0, moment_1.default)().startOf("year").toDate();
            const currentYear = (0, moment_1.default)().year();
            const response = {
                message: "Total deposits and withdrawals calculated successfully",
                withdrawals: [],
                deposits: [],
                periodNames: [],
            };
            let groupBy;
            let periods;
            if (timePeriod === constants_1.TIME_PERIOD.MONTHLY) {
                groupBy = { $month: "$createdAt" };
                periods = Array.from({ length: 12 }, (_, i) => (0, moment_1.default)().month(i).format("MMMM"));
                response.withdrawals = Array.from({ length: 12 }, (_, i) => ({
                    month: i + 1,
                    total: 0,
                }));
                response.deposits = Array.from({ length: 12 }, (_, i) => ({
                    month: i + 1,
                    total: 0,
                }));
                response.periodNames = periods;
            }
            else if (timePeriod === constants_1.TIME_PERIOD.QUARTERLY) {
                groupBy = { $ceil: { $divide: [{ $month: "$createdAt" }, 3] } };
                periods = ["Jan - Mar", "Apr - Jun", "Jul - Sept", "Oct - Dec"];
                response.withdrawals = Array.from({ length: 4 }, (_, i) => ({
                    quarter: i + 1,
                    total: 0,
                }));
                response.deposits = Array.from({ length: 4 }, (_, i) => ({
                    quarter: i + 1,
                    total: 0,
                }));
                response.periodNames = periods;
            }
            else if (timePeriod === constants_1.TIME_PERIOD.ANNUALLY) {
                groupBy = { $year: "$createdAt" };
                periods = [
                    currentYear.toString(),
                    (currentYear - 1).toString(),
                    (currentYear - 2).toString(),
                    (currentYear - 3).toString(),
                ];
                response.withdrawals = Array.from({ length: 4 }, (_, i) => ({
                    year: currentYear - i,
                    total: 0,
                }));
                response.deposits = Array.from({ length: 4 }, (_, i) => ({
                    year: currentYear - i,
                    total: 0,
                }));
                response.periodNames = periods;
            }
            else {
                throw new common_1.BadRequestException("Invalid time period provided, must be MONTHLY, QUARTER or ANNUALY specified");
            }
            const withdrawalsData = await this.merchantAppTxModel.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfYear },
                        symbol: symbol,
                        status: payment_enum_1.PaymentStatus.SUCCESS,
                        txType: enum_1.TransactionTypes.WITHDRAW,
                    },
                },
                {
                    $group: {
                        _id: groupBy,
                        totalReceivedAmount: { $sum: { $toDouble: "$recivedAmount" } },
                    },
                },
                {
                    $sort: { _id: 1 },
                },
            ]);
            withdrawalsData.forEach((item) => {
                let index;
                if (timePeriod === constants_1.TIME_PERIOD.MONTHLY) {
                    index = item._id - 1;
                }
                else if (timePeriod === constants_1.TIME_PERIOD.QUARTERLY) {
                    index = item._id - 1;
                }
                else {
                    index = periods.indexOf(item._id.toString());
                }
                if (index >= 0) {
                    response.withdrawals[index].total = item.totalReceivedAmount;
                }
            });
            const depositsData = await this.merchantAppTxModel.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfYear },
                        symbol: symbol,
                        status: payment_enum_1.PaymentStatus.SUCCESS,
                        txType: {
                            $in: [enum_1.TransactionTypes.DEPOSIT, enum_1.TransactionTypes.PAYMENT_LINKS],
                        },
                    },
                },
                {
                    $group: {
                        _id: groupBy,
                        totalReceivedAmount: { $sum: { $toDouble: "$recivedAmount" } },
                    },
                },
                {
                    $sort: { _id: 1 },
                },
            ]);
            depositsData.forEach((item) => {
                let index;
                if (timePeriod === constants_1.TIME_PERIOD.MONTHLY) {
                    index = item._id - 1;
                }
                else if (timePeriod === constants_1.TIME_PERIOD.QUARTERLY) {
                    index = item._id - 1;
                }
                else {
                    index = periods.indexOf(item._id.toString());
                }
                if (index >= 0) {
                    response.deposits[index].total = item.totalReceivedAmount;
                }
            });
            return response;
        }
        catch (error) {
            console.log("An error occurred:", error.message);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error);
            }
        }
    }
    async getMerchantCryptoSymbols() {
        try {
            const symbols = await this.tokenModel.distinct("symbol");
            const selectCoin = {
                ...symbols.reduce((acc, symbol) => {
                    acc[symbol] = symbol;
                    return acc;
                }, {}),
            };
            return selectCoin;
        }
        catch (error) {
            console.log("An error occurred:", error.message);
            throw new common_1.BadRequestException("Unable to retrieve merchant crypto symbols.");
        }
    }
    async activePaymentLinks(query) {
        try {
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const oneHourInSeconds = 3600;
            const paymentLinkData = await this.paymentLinkModel.find({
                expireTime: {
                    $gt: currentTimestamp,
                    $lte: currentTimestamp + oneHourInSeconds,
                },
                status: { $ne: "SUCCESS" },
            }, { expireTime: 1, status: 1, _id: 0 });
            const activeCount = paymentLinkData.length;
            console.log("Active Payment Links Count:", activeCount);
            return activeCount;
        }
        catch (error) {
            console.log("An error occurred:", error.message);
            throw new common_1.BadRequestException("Unable to calculate active payment links.");
        }
    }
    async activeMerchantApps(query) {
        try {
            const activeApps = await this.appsModel.countDocuments({});
            if (activeApps) {
                return activeApps;
            }
        }
        catch (error) {
            console.log("An error occurred:", error.message);
            throw new common_1.BadRequestException("Unable to calculate active payment links.");
        }
    }
    async depositTxFeeByAdmin(user, dto) {
        try {
            if (!user.isAdmin) {
                throw new common_1.BadRequestException("Only admin users can deposit");
            }
            const { paymentId, tokenBalance } = dto;
            const PRIVATE_KEY = config_service_1.ConfigService.keys.ADMIN_WALLET_PRIVATE_KEY;
            const parsedBalance = parseFloat(tokenBalance);
            if (isNaN(parsedBalance) || parsedBalance < 0) {
                throw new common_1.NotFoundException("Invalid token balance: " + tokenBalance);
            }
            if (!PRIVATE_KEY) {
                throw new common_1.NotFoundException("Private key not found");
            }
            const paymentLink = await this.paymentLinkModel.findById(paymentId);
            if (!paymentLink) {
                throw new common_1.NotFoundException("Payment link not found");
            }
            const isValidState = paymentLink.status === payment_enum_1.PaymentStatus.PARTIALLY_SUCCESS &&
                paymentLink.withdrawStatus === payment_enum_1.WithdrawPaymentStatus.PENDING;
            if (!isValidState) {
                throw new common_1.BadRequestException("Payment link is not in a valid state for depositing");
            }
            const app = await this.appsModel.findById(paymentLink.appId);
            if (!app) {
                throw new common_1.NotFoundException("App not found");
            }
            const receiverAddress = app?.EVMWalletMnemonic?.address;
            const receipt = await (0, evm_helper_1.deposit_bnb_for_gas_fee)(paymentLink?.chainId, PRIVATE_KEY, paymentLink?.tokenAddress, receiverAddress, tokenBalance, paymentLink?.toAddress);
            if (!receipt) {
                throw new common_1.NotFoundException("Unable to transfer gas fee");
            }
            else {
                paymentLink.withdrawStatus = payment_enum_1.WithdrawPaymentStatus.NATIVE_TRANSFER;
                paymentLink.save();
            }
            return receipt;
        }
        catch (error) {
            console.log("An error occurred:", error.message);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async withdrawFund(user, dto) {
        try {
            if (!user.isAdmin) {
                throw new common_1.BadRequestException("Only admin users can withdraw funds");
            }
            const { paymentId, amount, withdrawType } = dto;
            const parsedBalance = parseFloat(amount);
            if (isNaN(parsedBalance) || parsedBalance < 0) {
                throw new common_1.NotFoundException("Invalid token balance: " + amount);
            }
            const paymentLink = await this.paymentLinkModel.findById(paymentId);
            if (!paymentLink) {
                throw new common_1.NotFoundException("Payment link not found");
            }
            const privateKey = await this.encryptionService.decryptData(paymentLink.privateKey);
            const app = await this.appsModel.findById(paymentLink.appId);
            if (!app) {
                throw new common_1.NotFoundException("App not found");
            }
            if (withdrawType === payment_enum_1.WithdrawType.MERCHANT &&
                paymentLink.withdrawStatus !== payment_enum_1.WithdrawPaymentStatus.ADMIN_CHARGES) {
                throw new common_1.BadRequestException("Direct merchant withdrawal not allowed, please withdraw the admin fee first.");
            }
            let adminWallet;
            const adminInfo = await this.adminService.getPlatformFee();
            if (adminInfo && "data" in adminInfo) {
                adminWallet = adminInfo?.data?.adminWallet;
            }
            else {
                throw new common_1.NotFoundException("Admin wallet not found");
            }
            const receiverAddress = withdrawType === payment_enum_1.WithdrawType.MERCHANT
                ? app?.EVMWalletMnemonic?.address
                : adminWallet;
            const receipt = await (0, evm_helper_1.withdrawEvmFund)(paymentLink.chainId, privateKey, paymentLink.tokenAddress, amount, receiverAddress);
            if (receipt?.transactionHash) {
                if (withdrawType === payment_enum_1.WithdrawType.MERCHANT) {
                    paymentLink.withdrawStatus = payment_enum_1.WithdrawPaymentStatus.SUCCESS;
                    paymentLink.status = payment_enum_1.PaymentStatus.SUCCESS;
                    paymentLink.amountAfterTax = (Number(paymentLink.amount) - Number(paymentLink.adminFee)).toString();
                }
                else {
                    paymentLink.withdrawStatus = payment_enum_1.WithdrawPaymentStatus.ADMIN_CHARGES;
                    paymentLink.adminFee = amount;
                    paymentLink.adminFeeWallet = receiverAddress;
                }
                paymentLink.save();
            }
            return { receipt };
        }
        catch (error) {
            console.log("An error occurred:", error.message);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getUserPaymentsLinksAmountSum(user) {
        try {
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 11);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            const newData = await this.appsModel.aggregate([
                {
                    $match: {
                        merchantId: user.userId,
                    },
                },
                {
                    $lookup: {
                        from: "paymentlinks",
                        localField: "_id",
                        foreignField: "appId",
                        as: "paymentLinks",
                    },
                },
                { $unwind: "$paymentLinks" },
                {
                    $match: {
                        "paymentLinks.status": "SUCCESS",
                        "paymentLinks.withdrawStatus": "SUCCESS",
                        "paymentLinks.type": wallet_monitor_enum_1.WalletType.PAYMENT_LINK,
                        "paymentLinks.createdAt": { $gte: startDate },
                    },
                },
                {
                    $project: {
                        appId: "$_id",
                        amount: { $toDouble: "$paymentLinks.amount" },
                        symbol: "$paymentLinks.symbol",
                        createdAt: {
                            $ifNull: ["$paymentLinks.createdAt", new Date(0)],
                        },
                        month: { $month: "$paymentLinks.createdAt" },
                        year: { $year: "$paymentLinks.createdAt" },
                    },
                },
                {
                    $group: {
                        _id: { month: "$month", year: "$year", symbol: "$symbol" },
                        totalAmount: { $sum: "$amount" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        month: "$_id.month",
                        year: "$_id.year",
                        symbol: "$_id.symbol",
                        totalAmount: 1,
                    },
                },
            ]);
            const response = await (0, helper_1.getCoingeckoPrice)("usd");
            const monthlyTotals = {};
            for (const item of newData) {
                const coingeckoSymbol = await (0, helper_1.getCoingeckoSymbol)(item.symbol);
                const priceInUsd = response?.data[coingeckoSymbol]?.usd || 0;
                const totalPrice = item.totalAmount * priceInUsd;
                const monthYearKey = `${item.month}-${item.year}`;
                if (!monthlyTotals[monthYearKey]) {
                    monthlyTotals[monthYearKey] = 0;
                }
                monthlyTotals[monthYearKey] += totalPrice;
            }
            const finalData = (() => {
                const monthNames = [
                    "JAN",
                    "FEB",
                    "MAR",
                    "APR",
                    "MAY",
                    "JUN",
                    "JUL",
                    "AUG",
                    "SEP",
                    "OCT",
                    "NOV",
                    "DEC",
                ];
                const currentDate = new Date();
                const months = [];
                for (let i = 11; i >= 0; i--) {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                    const month = date.getMonth() + 1;
                    const year = date.getFullYear();
                    const formattedMonth = `${monthNames[month - 1]}-${year}`;
                    months.push({
                        month,
                        year,
                        formattedMonth,
                        totalPrice: 0,
                    });
                }
                const dataMap = newData.reduce((acc, item) => {
                    const key = `${item.month}-${item.year}`;
                    const coingeckoSymbol = (0, helper_1.getCoingeckoSymbol)(item.symbol);
                    const priceInUsd = response?.data[coingeckoSymbol]?.usd || 0;
                    const totalPrice = item.totalAmount * priceInUsd;
                    if (!acc[key])
                        acc[key] = 0;
                    acc[key] += totalPrice;
                    return acc;
                }, {});
                return months.map((monthObj) => ({
                    month: monthObj.formattedMonth,
                    totalPrice: dataMap[`${monthObj.month}-${monthObj.year}`] || 0,
                }));
            })();
            return {
                data: finalData,
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
    async getUserBalanceSum(query, user) {
        try {
            let balance = {
                bsc: 0,
                eth: 0,
                matic: 0,
                avax: 0,
                trx: 0,
                btc: 0,
            };
            const { currency } = query;
            if (!currency) {
                throw new common_1.BadRequestException("Currency is required");
            }
            const walletAddresses = await this.appsModel
                .find({
                merchantId: user.userId,
            })
                .select("EVMWalletMnemonic.address TronWalletMnemonic.address BtcWalletMnemonic.address");
            const addressLists = walletAddresses.reduce((acc, wallet) => {
                if (wallet.EVMWalletMnemonic?.address) {
                    acc.evmAddresses.push(wallet.EVMWalletMnemonic.address);
                }
                if (wallet.TronWalletMnemonic?.address) {
                    acc.tronAddresses.push(wallet.TronWalletMnemonic.address);
                }
                if (wallet.BtcWalletMnemonic?.address) {
                    acc.btcAddresses.push(wallet.BtcWalletMnemonic.address);
                }
                return acc;
            }, {
                evmAddresses: [],
                tronAddresses: [],
                btcAddresses: [],
            });
            const evm = await (0, evm_helper_1.getEVMNativeBalance)(addressLists?.evmAddresses);
            const trx = await (0, tron_helper_1.getTronNativeBalance)(addressLists?.tronAddresses);
            const btc = await (0, bitcoin_helper_1.getBTCNativeBalance)(addressLists?.btcAddresses);
            const response = await (0, helper_1.getCoingeckoPrice)(`${currency},USD`);
            balance = { ...balance, trx, btc, ...evm };
            let currencyConversion = {
                bsc: balance.bsc * response.data.binancecoin[currency],
                eth: balance.eth * response.data.ethereum[currency],
                matic: balance.matic * response.data["matic-network"][currency],
                avax: balance.avax * response.data["avalanche-2"][currency],
                trx: balance.trx * response.data.tron[currency],
                btc: balance.btc * response.data.bitcoin[currency],
            };
            const usdTotal = balance.bsc * response.data.binancecoin.usd +
                balance.eth * response.data.ethereum.usd +
                balance.matic * response.data["matic-network"].usd +
                balance.avax * response.data["avalanche-2"].usd +
                balance.trx * response.data.tron.usd +
                balance.btc * response.data.bitcoin.usd;
            const symbolToName = {
                bsc: "Binance",
                eth: "Ethereum",
                matic: "Polygon",
                avax: "Avalanche",
                trx: "Tron",
                btc: "Bitcoin",
            };
            const data = Object.keys(balance).map((key) => ({
                name: symbolToName[key] || "Unknown",
                symbol: key,
                balance: parseFloat(balance[key]),
                currencyConversion: currencyConversion[key],
            }));
            return { currency, data, usdTotal };
        }
        catch (error) {
            console.error("An error occurred:", error.message);
            throw new common_1.BadRequestException(error);
        }
    }
    async tablePaymentLinkCount(dto) {
        try {
            console.log("Rahul ----- 900 : ");
            const { startDate, endDate, token, timeFormat } = dto;
            const start = new Date(startDate.split("/").reverse().join("-"));
            const end = new Date(endDate.split("/").reverse().join("-"));
            console.log("Start date: " + start, "end date: " + end);
            const filter = {
                status: payment_enum_1.PaymentStatus.SUCCESS,
                symbol: token,
                createdAt: { $gte: start, $lte: end },
            };
            console.log("filter : ", filter);
            let groupByField;
            let addFields;
            let projectFields;
            if (timeFormat === payment_enum_1.DaysType.DAYS) {
                groupByField = {
                    day: { $dateTrunc: { date: "$createdAt", unit: "day" } },
                };
                projectFields = { _id: 0, date: "$_id.day", count: 1 };
                addFields = {};
            }
            else if (timeFormat === payment_enum_1.DaysType.WEEKS) {
                groupByField = {
                    week: { $isoWeek: "$createdAt" },
                    year: { $isoWeekYear: "$createdAt" },
                };
                projectFields = { _id: 0, weekStart: 1, weekEnd: 1, count: 1 };
                addFields = {
                    weekStart: {
                        $dateFromParts: {
                            isoWeekYear: "$_id.year",
                            isoWeek: "$_id.week",
                            isoDayOfWeek: 1,
                        },
                    },
                };
            }
            else if (timeFormat === payment_enum_1.DaysType.MONTHS) {
                groupByField = {
                    month: { $month: "$createdAt" },
                    year: { $year: "$createdAt" },
                };
                projectFields = {
                    _id: 0,
                    month: "$_id.month",
                    year: "$_id.year",
                    count: 1,
                };
                addFields = {};
            }
            else if (timeFormat === payment_enum_1.DaysType.YEARS) {
                groupByField = { year: { $year: "$createdAt" } };
                projectFields = { _id: 0, year: "$_id.year", count: 1 };
                addFields = {};
            }
            else {
                throw new Error("Invalid Time Format");
            }
            const data = await this.paymentLinkModel.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: groupByField,
                        count: { $sum: 1 },
                    },
                },
                ...(Object.keys(addFields).length ? [{ $addFields: addFields }] : []),
                {
                    $addFields: {
                        weekEnd: {
                            $dateAdd: {
                                startDate: "$weekStart",
                                unit: "day",
                                amount: 6,
                            },
                        },
                    },
                },
                {
                    $project: projectFields,
                },
                {
                    $sort: { "_id.day": 1, "_id.week": 1, "_id.month": 1, "_id.year": 1 },
                },
            ]);
            return {
                message: "Payment link count",
                total: data.length,
                symbol: token,
                data: data,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred in tablePaymentLinkCount:", error.message);
                throw new common_1.BadRequestException("Unable to retrieve payment link");
            }
        }
    }
    async tableMerchantDepositWithdrawCount(dto) {
        try {
            const { startDate, endDate, token, timeFormat } = dto;
            const start = new Date(startDate.split("/").reverse().join("-"));
            const end = new Date(endDate.split("/").reverse().join("-"));
            console.log("Start date: " + start, "end date: " + end);
            const filter = {
                status: payment_enum_1.PaymentStatus.SUCCESS,
                symbol: token,
                txType: {
                    $in: [enum_1.TransactionTypes.DEPOSIT, enum_1.TransactionTypes.PAYMENT_LINKS],
                },
                createdAt: { $gte: start, $lte: end },
            };
            let groupByField;
            let addFields;
            let projectFields;
            if (timeFormat === payment_enum_1.DaysType.DAYS) {
                groupByField = {
                    day: { $dateTrunc: { date: "$createdAt", unit: "day" } },
                };
                projectFields = { _id: 0, date: "$_id.day", count: 1 };
                addFields = {};
            }
            else if (timeFormat === payment_enum_1.DaysType.WEEKS) {
                groupByField = {
                    week: { $isoWeek: "$createdAt" },
                    year: { $isoWeekYear: "$createdAt" },
                };
                projectFields = { _id: 0, weekStart: 1, weekEnd: 1, count: 1 };
                addFields = {
                    weekStart: {
                        $dateFromParts: {
                            isoWeekYear: "$_id.year",
                            isoWeek: "$_id.week",
                            isoDayOfWeek: 1,
                        },
                    },
                    weekEnd: {
                        $dateAdd: {
                            startDate: "$weekStart",
                            unit: "day",
                            amount: 6,
                        },
                    },
                };
            }
            else if (timeFormat === payment_enum_1.DaysType.MONTHS) {
                groupByField = {
                    month: { $month: "$createdAt" },
                    year: { $year: "$createdAt" },
                };
                projectFields = {
                    _id: 0,
                    month: "$_id.month",
                    year: "$_id.year",
                    count: 1,
                };
                addFields = {};
            }
            else if (timeFormat === payment_enum_1.DaysType.YEARS) {
                groupByField = { year: { $year: "$createdAt" } };
                projectFields = { _id: 0, year: "$_id.year", count: 1 };
                addFields = {};
            }
            else {
                throw new Error("Invalid Time Format");
            }
            const data = await this.merchantAppTxModel.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: groupByField,
                        count: { $sum: 1 },
                    },
                },
                ...(Object.keys(addFields).length
                    ? [
                        { $addFields: { ...addFields } },
                        {
                            $addFields: {
                                weekEnd: {
                                    $dateAdd: {
                                        startDate: "$weekStart",
                                        unit: "day",
                                        amount: 6,
                                    },
                                },
                            },
                        },
                    ]
                    : []),
                {
                    $project: projectFields,
                },
                {
                    $sort: { "_id.day": 1, "_id.week": 1, "_id.month": 1, "_id.year": 1 },
                },
            ]);
            return {
                message: "Merchant deposit/withdraw count",
                total: data.length,
                symbol: token,
                data: data,
            };
        }
        catch (error) {
            console.log("An error occurred:", error.message);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error);
            }
        }
    }
    async tableMerchantAppTxRevenueReports(dto) {
        try {
            const { startDate, endDate, token, timeFormat } = dto;
            const start = new Date(startDate.split("/").reverse().join("-"));
            const end = new Date(endDate.split("/").reverse().join("-"));
            console.log("Start date: " + start, "end date: " + end);
            const filter = {
                status: payment_enum_1.PaymentStatus.SUCCESS,
                symbol: token,
                txType: {
                    $in: [enum_1.TransactionTypes.WITHDRAW],
                },
                createdAt: { $gte: start, $lte: end },
            };
            let groupByField;
            let addFields;
            let projectFields;
            if (timeFormat === payment_enum_1.DaysType.DAYS) {
                groupByField = {
                    day: { $dateTrunc: { date: "$createdAt", unit: "day" } },
                };
                projectFields = { _id: 0, date: "$_id.day", adminFee: 1 };
                addFields = {};
            }
            else if (timeFormat === payment_enum_1.DaysType.WEEKS) {
                groupByField = {
                    week: { $isoWeek: "$createdAt" },
                    year: { $isoWeekYear: "$createdAt" },
                };
                projectFields = {
                    _id: 0,
                    weekStart: 1,
                    weekEnd: 1,
                    adminFee: 1,
                };
                addFields = {
                    weekStart: {
                        $dateFromParts: {
                            isoWeekYear: "$_id.year",
                            isoWeek: "$_id.week",
                            isoDayOfWeek: 1,
                        },
                    },
                    weekEnd: {
                        $dateAdd: {
                            startDate: "$weekStart",
                            unit: "day",
                            amount: 6,
                        },
                    },
                };
            }
            else if (timeFormat === payment_enum_1.DaysType.MONTHS) {
                groupByField = {
                    month: { $month: "$createdAt" },
                    year: { $year: "$createdAt" },
                };
                projectFields = {
                    _id: 0,
                    month: "$_id.month",
                    year: "$_id.year",
                    adminFee: 1,
                };
                addFields = {};
            }
            else if (timeFormat === payment_enum_1.DaysType.YEARS) {
                groupByField = { year: { $year: "$createdAt" } };
                projectFields = { _id: 0, year: "$_id.year", adminFee: 1 };
                addFields = {};
            }
            else {
                throw new Error("Invalid Time Format");
            }
            const data = await this.merchantAppTxModel.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: groupByField,
                        adminFee: { $sum: { $toDouble: "$adminFee" } },
                    },
                },
                ...(Object.keys(addFields).length
                    ? [{ $addFields: { ...addFields } }]
                    : []),
                {
                    $project: projectFields,
                },
                {
                    $sort: {
                        "_id.day": 1,
                        "_id.week": 1,
                        "_id.month": 1,
                        "_id.year": 1,
                    },
                },
            ]);
            const totalAdminFee = data.reduce((sum, item) => sum + (item.adminFee || 0), 0);
            return {
                message: "Revenue reports generated successfully",
                total: data.length,
                symbol: token,
                totalAdminFee: totalAdminFee,
                data: data,
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
    async tablePaymentLinkRevenueReports(dto) {
        try {
            const { startDate, endDate, token, timeFormat } = dto;
            const start = new Date(startDate.split("/").reverse().join("-"));
            const end = new Date(endDate.split("/").reverse().join("-"));
            console.log("Start date: " + start, "end date: " + end);
            const filter = {
                status: payment_enum_1.PaymentStatus.SUCCESS,
                symbol: token,
                createdAt: { $gte: start, $lte: end },
            };
            let groupByField;
            let addFields;
            let projectFields;
            if (timeFormat === payment_enum_1.DaysType.DAYS) {
                groupByField = {
                    day: { $dateTrunc: { date: "$createdAt", unit: "day" } },
                };
                projectFields = { _id: 0, date: "$_id.day", adminFee: 1 };
                addFields = {};
            }
            else if (timeFormat === payment_enum_1.DaysType.WEEKS) {
                groupByField = {
                    week: { $isoWeek: "$createdAt" },
                    year: { $isoWeekYear: "$createdAt" },
                };
                projectFields = {
                    _id: 0,
                    weekStart: 1,
                    weekEnd: 1,
                    adminFee: 1,
                };
                addFields = {
                    weekStart: {
                        $dateFromParts: {
                            isoWeekYear: "$_id.year",
                            isoWeek: "$_id.week",
                            isoDayOfWeek: 1,
                        },
                    },
                    weekEnd: {
                        $dateAdd: {
                            startDate: "$weekStart",
                            unit: "day",
                            amount: 6,
                        },
                    },
                };
            }
            else if (timeFormat === payment_enum_1.DaysType.MONTHS) {
                groupByField = {
                    month: { $month: "$createdAt" },
                    year: { $year: "$createdAt" },
                };
                projectFields = {
                    _id: 0,
                    month: "$_id.month",
                    year: "$_id.year",
                    adminFee: 1,
                };
                addFields = {};
            }
            else if (timeFormat === payment_enum_1.DaysType.YEARS) {
                groupByField = { year: { $year: "$createdAt" } };
                projectFields = { _id: 0, year: "$_id.year", adminFee: 1 };
                addFields = {};
            }
            else {
                throw new Error("Invalid Time Format");
            }
            const data = await this.paymentLinkModel.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: groupByField,
                        adminFee: { $sum: { $toDouble: "$adminFee" } },
                    },
                },
                ...(Object.keys(addFields).length
                    ? [{ $addFields: { ...addFields } }]
                    : []),
                {
                    $project: projectFields,
                },
                {
                    $sort: {
                        "_id.day": 1,
                        "_id.week": 1,
                        "_id.month": 1,
                        "_id.year": 1,
                    },
                },
            ]);
            const totalAdminFee = data.reduce((sum, item) => sum + (item.adminFee || 0), 0);
            return {
                message: "Revenue reports of payment link generated successfully",
                total: data?.length,
                symbol: token,
                totalAdminFee: totalAdminFee,
                data: data,
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
    async withdrawPaymentLinkFundsByAdmin(dto, user) {
        try {
            console.log("user of the user : ", user);
            const { paymentId, chainId, amount, withdrawType } = dto;
            if (!user?.isAdmin) {
                throw new common_1.BadRequestException("Not permitted. Only the admin can access this.");
            }
            const payment = await this.paymentLinkModel
                .findById(paymentId)
                .select("+privateKey");
            if (!payment) {
                throw new common_1.NotFoundException("Invalid payment Id");
            }
            const decryptedPrivateKey = this.encryptionService.decryptData(payment?.privateKey);
            let adminFeeInfo;
            const adminInfo = await this.adminService.getPlatformFee();
            if (adminInfo && "data" in adminInfo) {
                adminFeeInfo = adminInfo?.data;
            }
            else {
                throw new common_1.NotFoundException("Admin wallet not found");
            }
            let decimal = 0;
            if (!payment.tokenDecimals) {
                throw new common_1.NotFoundException("Token decimals not found in payment link");
            }
            else {
                decimal = parseInt(payment?.tokenDecimals);
            }
            const app = await this.appsModel.findOne({
                _id: payment?.appId,
            });
            if (!app) {
                throw new common_1.NotFoundException("Invalid app");
            }
            let adminFeeWalletAddress = null;
            let adminPaymentLinksCharges = 0;
            console.log("adminFeeInfo : ", adminFeeInfo);
            if (constants_1.EVM_CHAIN_ID_LIST.includes(payment.chainId)) {
                adminFeeWalletAddress = adminFeeInfo?.adminWallet;
                adminPaymentLinksCharges = adminFeeInfo?.platformFee;
            }
            else if (payment.chainId === index_1.TRON_CHAIN_ID) {
                adminFeeWalletAddress = adminFeeInfo.tronAdminWallet;
                adminPaymentLinksCharges = adminFeeInfo.tronPlatformFee;
            }
            else if (payment.chainId === index_1.BTC_CHAIN_ID) {
                adminFeeWalletAddress = adminFeeInfo.btcAdminWallet;
                adminPaymentLinksCharges = adminFeeInfo.btcPlatformFee;
            }
            else {
                throw new Error("Invalid chainId");
            }
            let withdrawalAmount = payment?.recivedAmount;
            const tax = await (0, helper_1.calculateTaxes)(withdrawalAmount, adminPaymentLinksCharges);
            console.log("Tax is : ", tax);
            let receipt = null;
            let withdrawalAddress = null;
            if (payment.chainId === index_1.BTC_CHAIN_ID) {
                throw new common_1.BadRequestException("Bitcoin transaction not working properly");
            }
            else if (payment?.chainId === index_1.TRON_CHAIN_ID) {
                withdrawalAddress =
                    withdrawType == payment_enum_1.WithdrawType.ADMIN_CHARGES
                        ? adminFeeWalletAddress
                        : app?.TronWalletMnemonic?.address;
                receipt = await (0, tron_helper_1.transferTron)(decryptedPrivateKey, payment?.tokenAddress, withdrawalAddress, amount, decimal);
            }
            else if (constants_1.EVM_CHAIN_ID_LIST.includes(payment.chainId)) {
                withdrawalAddress =
                    withdrawType == payment_enum_1.WithdrawType.ADMIN_CHARGES
                        ? adminFeeWalletAddress
                        : app?.EVMWalletMnemonic?.address;
                receipt = await (0, evm_helper_1.merchantEvmFundWithdraw)(payment?.chainId, decryptedPrivateKey, payment?.tokenAddress, amount, withdrawalAddress, decimal, "");
            }
            console.log("Receipt is : ", receipt);
            if (receipt.status === false) {
                throw new common_1.BadRequestException(receipt?.error || "Unable to withdraw funds");
            }
            else {
                if (withdrawType == payment_enum_1.WithdrawType.ADMIN_CHARGES) {
                    if (payment.status != payment_enum_1.PaymentStatus.SUCCESS) {
                        payment.withdrawStatus = payment_enum_1.WithdrawPaymentStatus.ADMIN_CHARGES;
                    }
                    payment.adminFee = payment.adminFee
                        ? (Number(payment.adminFee) + Number(amount)).toString()
                        : amount;
                    payment.adminFeeWallet = withdrawalAddress;
                }
                else {
                    payment.status = payment_enum_1.PaymentStatus.SUCCESS;
                    payment.withdrawStatus = payment_enum_1.WithdrawPaymentStatus.SUCCESS;
                    payment.amountAfterTax = payment.amountAfterTax
                        ? (Number(payment.amountAfterTax) + Number(amount)).toString()
                        : amount;
                }
                await payment.save();
            }
            return {
                receipt,
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
    async getPaymentLinkTronTokenBalance(dto, user) {
        try {
            const { paymentId } = dto;
            if (!user?.isAdmin) {
                throw new common_1.BadRequestException("Not permitted. Only the admin can access this.");
            }
            const payment = await this.paymentLinkModel
                .findById(paymentId)
                .select("+privateKey");
            if (!payment) {
                throw new common_1.NotFoundException("Invalid payment Id");
            }
            if (payment.chainId != index_1.TRON_CHAIN_ID) {
                throw new common_1.NotFoundException("Invalid chain id for tron balance");
            }
            const decryptedPrivateKey = this.encryptionService.decryptData(payment?.privateKey);
            const balance = await (0, tron_helper_1.getTronTokenBalance)(payment?.toAddress, payment?.tokenAddress, decryptedPrivateKey);
            console.log("balance : ", balance);
            return balance;
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
};
exports.PaymentLinkService = PaymentLinkService;
exports.PaymentLinkService = PaymentLinkService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(payment_link_schema_1.PaymentLink.name)),
    __param(1, (0, mongoose_1.InjectModel)(apps_schema_1.Apps.name)),
    __param(2, (0, mongoose_1.InjectModel)(wallet_monitor_schema_1.WalletMonitor.name)),
    __param(3, (0, mongoose_1.InjectModel)(token_schema_1.Token.name)),
    __param(5, (0, mongoose_1.InjectModel)(merchant_app_tx_schema_1.MerchantAppTx.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        encryption_service_1.EncryptionService,
        mongoose_2.Model,
        admin_service_1.AdminService,
        webhook_service_1.WebhookService])
], PaymentLinkService);
//# sourceMappingURL=payment-link.service.js.map