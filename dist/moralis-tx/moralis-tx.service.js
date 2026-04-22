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
var TransactionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const axios_1 = __importDefault(require("axios"));
const tron_helper_1 = require("./../helpers/tron.helper");
const constants_1 = require("../constants");
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const wallet_monitor_schema_1 = require("../wallet-monitor/schema/wallet-monitor.schema");
const moralis_1 = __importDefault(require("moralis"));
const config_service_1 = require("../config/config.service");
const payment_link_schema_1 = require("../payment-link/schema/payment-link.schema");
const apps_schema_1 = require("../apps/schema/apps.schema");
const payment_enum_1 = require("../payment-link/schema/payment.enum");
const ethers_1 = require("ethers");
const merchant_app_tx_schema_1 = require("../merchant-app-tx/schema/merchant-app-tx.schema");
const evm_helper_1 = require("../helpers/evm.helper");
const encryption_service_1 = require("../utils/encryption.service");
const admin_service_1 = require("../admin/admin.service");
const tron_helper_2 = require("../helpers/tron.helper");
const helper_1 = require("../helpers/helper");
const bitcoin_helper_1 = require("../helpers/bitcoin.helper");
const token_schema_1 = require("../token/schema/token.schema");
const schedule_1 = require("@nestjs/schedule");
const enum_1 = require("../merchant-app-tx/schema/enum");
const wallet_monitor_enum_1 = require("../wallet-monitor/schema/wallet-monitor.enum");
const admin_schema_1 = require("../admin/schema/admin.schema");
const webhook_service_1 = require("../webhook/webhook.service");
const webhook_log_schema_1 = require("../webhook/schema/webhook-log.schema");
let TransactionService = TransactionService_1 = class TransactionService {
    constructor(transactionModel, monitorModel, paymentLinkModel, appModel, tokenModel, adminModel, merchantTxModel, adminService, encryptionService, webhookService) {
        this.transactionModel = transactionModel;
        this.monitorModel = monitorModel;
        this.paymentLinkModel = paymentLinkModel;
        this.appModel = appModel;
        this.tokenModel = tokenModel;
        this.adminModel = adminModel;
        this.merchantTxModel = merchantTxModel;
        this.adminService = adminService;
        this.encryptionService = encryptionService;
        this.webhookService = webhookService;
        this.logger = new common_1.Logger(TransactionService_1.name);
    }
    async stream(tx) {
        try {
            console.log("--- tx --- : ", tx);
            const transactions = [];
            const commonData = {
                chainId: tx?.chainId,
                streamId: tx?.streamId,
                block: tx?.block,
            };
            if (tx.txs && tx.txs.length > 0) {
                for (const transaction of tx.txs) {
                    transactions.push({
                        ...commonData,
                        ...transaction,
                    });
                }
            }
            if (tx.erc20Transfers && tx.erc20Transfers.length > 0) {
                for (const transfer of tx.erc20Transfers) {
                    console.log("calling for erc20");
                    let { value, ...transferWithoutValue } = transfer;
                    transactions.push({
                        ...commonData,
                        ...transferWithoutValue,
                    });
                }
            }
            console.log("transactions list length : ", transactions.length);
            const merged = [];
            for (const tx of transactions) {
                const existingTx = merged.find((item) => item.chainId === tx.chainId &&
                    item.streamId === tx.streamId &&
                    item.block.hash === tx.block.hash &&
                    item.hash === tx.transactionHash);
                if (existingTx) {
                    Object.assign(existingTx, tx);
                }
                else {
                    merged.push(tx);
                }
            }
            console.log("merged tx list length is : ", merged.length);
            for (const tx of merged) {
                console.log("tx to save into the db :  ", tx);
                try {
                    const txChainId = parseInt(tx?.chainId, 16).toString();
                    const txContract = tx?.contract ? tx.contract : constants_1.NATIVE;
                    const txAmount = tx?.valueWithDecimals
                        ? tx?.valueWithDecimals
                        : ethers_1.ethers.utils.formatUnits(tx?.value, 18);
                    const isPaymentExist = await this.paymentLinkModel.findOne({
                        $or: [
                            { hash: tx.transactionHash || tx.hash },
                            { transactionHash: tx.transactionHash || tx.hash },
                            { block: tx.block },
                        ],
                    });
                    const isAppExist = await this.merchantTxModel.findOne({
                        $and: [
                            { hash: tx.transactionHash || tx.hash },
                            { blockNumber: tx.block.number },
                        ],
                    });
                    const resultTo = await this.checkWalletTx(tx?.to ? tx.to : tx?.toAddress, txContract, txChainId, txAmount);
                    console.log("resultTo is : ", resultTo, "isPaymentExist : ", isPaymentExist, "isAppExist", isAppExist);
                    if (resultTo &&
                        resultTo.transactionType === "PAYMENT_LINK" &&
                        !isPaymentExist) {
                        console.log("Create Paymentlink Transaction");
                        await this.paymentLinkModel.updateOne({ _id: resultTo._id }, {
                            $set: {
                                recivedAmount: resultTo.accumulatedAmount,
                                status: payment_enum_1.PaymentStatus.PARTIALLY_SUCCESS,
                                block: tx?.block,
                                hash: tx?.hash,
                                gas: tx?.gas,
                                gasPrice: tx?.gasPrice,
                                nonce: tx?.nonce,
                                fromAddress: tx?.fromAddress,
                                tokenName: tx?.tokenName,
                                tokenSymbol: tx?.tokenSymbol,
                                tokenDecimals: tx?.tokenDecimals,
                                txType: enum_1.TransactionTypes.PAYMENT_LINKS,
                            },
                        });
                        console.log("Payment received in payment link -> if there is not native balance transfer on it.");
                        const paymentLink = await this.paymentLinkModel.findById(resultTo._id);
                        if (paymentLink) {
                            await this.webhookService.sendWebhook(paymentLink.appId.toString(), paymentLink._id.toString(), webhook_log_schema_1.WebhookEvent.PAYMENT_CONFIRMED, {
                                ...paymentLink.toObject(),
                                status: payment_enum_1.PaymentStatus.PARTIALLY_SUCCESS,
                                hash: tx?.hash,
                                fromAddress: tx?.fromAddress,
                                recivedAmount: resultTo.accumulatedAmount,
                            });
                        }
                    }
                    else if (resultTo &&
                        resultTo.transactionType === "PARTIAL_PAYMENT_LINK" &&
                        !isPaymentExist) {
                        console.log("Create Partial Paymentlink Transaction");
                        await this.paymentLinkModel.updateOne({ _id: resultTo._id }, {
                            $set: {
                                recivedAmount: resultTo.accumulatedAmount,
                                block: tx?.block,
                                hash: tx?.hash,
                                gas: tx?.gas,
                                gasPrice: tx?.gasPrice,
                                nonce: tx?.nonce,
                                fromAddress: tx?.fromAddress,
                                tokenName: tx?.tokenName,
                                tokenSymbol: tx?.tokenSymbol,
                                tokenDecimals: tx?.tokenDecimals,
                                txType: enum_1.TransactionTypes.PAYMENT_LINKS,
                            },
                        });
                        console.log("Partial payment synced to database but kept in PENDING status.");
                    }
                    else if (resultTo &&
                        resultTo.transactionType === "APP" &&
                        !isAppExist) {
                        const isTxFromPaymentLink = await this.paymentLinkModel.findOne({
                            toAddress: {
                                $regex: `^${tx?.from || tx?.fromAddress}$`,
                                $options: "i",
                            },
                        });
                        console.log("Create App Transaction : ", isTxFromPaymentLink);
                        const chainId = Number(tx?.chainId);
                        const networkData = (0, evm_helper_1.getNetwork)(chainId);
                        const newData = {
                            appsId: resultTo?._id,
                            recivedAmount: txAmount,
                            status: payment_enum_1.PaymentStatus.SUCCESS,
                            hash: tx?.hash,
                            gas: tx?.gas,
                            gasPrice: tx?.gasPrice,
                            fromAddress: tx?.from || tx?.fromAddress,
                            toAddress: tx?.to || tx?.toAddress,
                            amount: "0",
                            note: isTxFromPaymentLink
                                ? "Received funds from payment link"
                                : "Received funds from a transaction",
                            blockNumber: tx?.block?.number,
                            chainId: chainId,
                            symbol: tx?.tokenSymbol || networkData.symbol,
                            txType: isTxFromPaymentLink
                                ? enum_1.TransactionTypes.PAYMENT_LINKS
                                : enum_1.TransactionTypes.DEPOSIT,
                        };
                        await this.merchantTxModel.create(newData);
                    }
                    else {
                        console.log("Not a valid transaction type");
                    }
                }
                catch (error) {
                    console.error("Error storing transaction:", error);
                }
            }
            return merged;
        }
        catch (error) {
            console.error("Error in stream method:", error);
            throw error;
        }
    }
    async deletePaymentLinksWhichIsNotExistAnymore() {
        this.logger.debug("--------------------- Cron Job Started 30 Sec (To delete expire payment links) -----------------------");
        const currentTime = Date.now() / 1000;
        const paymentLinksToDelete = await this.monitorModel.find({
            expiryTime: { $lt: currentTime },
            walletType: wallet_monitor_enum_1.WalletType.PAYMENT_LINK,
            isExpiry: true,
        });
        if (paymentLinksToDelete?.length > 0) {
            const walletAddressToDelete = paymentLinksToDelete.map((doc) => doc.walletAddress);
            const deletedKey = await this.monitorModel.deleteMany({
                _id: { $in: paymentLinksToDelete.map((doc) => doc._id) },
            });
            const expiredPaymentLinks = await this.paymentLinkModel.find({
                toAddress: { $in: walletAddressToDelete },
                status: payment_enum_1.PaymentStatus.PENDING,
            });
            await this.paymentLinkModel.updateMany({
                toAddress: { $in: walletAddressToDelete },
                status: payment_enum_1.PaymentStatus.PENDING,
            }, {
                $set: {
                    status: payment_enum_1.PaymentStatus.EXPIRED,
                },
            });
            for (const paymentLink of expiredPaymentLinks) {
                await this.webhookService.sendWebhook(paymentLink.appId.toString(), paymentLink._id.toString(), webhook_log_schema_1.WebhookEvent.PAYMENT_EXPIRED, {
                    ...paymentLink.toObject(),
                    status: payment_enum_1.PaymentStatus.EXPIRED,
                });
            }
            await moralis_1.default.Streams.deleteAddress({
                id: config_service_1.ConfigService.keys.WEB_STREAMER_ID,
                address: walletAddressToDelete,
            });
        }
    }
    async deleteAppsWhichIsNotExistAnymore() {
        this.logger.debug("-------- New Cron Job running to delete apps that are not existing anymore, every 1 hours --------");
        const monitorWallets = await this.monitorModel.find({
            walletType: "APP",
        });
        let walletIdsToDelete = [];
        let walletAddressesToDelete = [];
        for (const wallet of monitorWallets) {
            const appExists = await this.appModel.findOne({
                "EVMWalletMnemonic.address": {
                    $regex: new RegExp(`^${wallet.walletAddress}$`, "i"),
                },
            });
            if (!appExists) {
                walletIdsToDelete.push(wallet._id);
                walletAddressesToDelete.push(wallet.walletAddress);
            }
        }
        if (walletIdsToDelete.length > 0) {
            await this.monitorModel.deleteMany({
                _id: { $in: walletIdsToDelete },
            });
            await moralis_1.default.Streams.deleteAddress({
                id: config_service_1.ConfigService.keys.WEB_STREAMER_ID,
                address: walletAddressesToDelete,
            });
        }
        else {
            console.log("No wallets found to delete.");
        }
        console.log("Deleted App count: ", walletIdsToDelete.length);
    }
    async withdrawPaymentFromLinksAndUpdateStatus() {
        try {
            this.logger.debug("-------------- Cron Job -> Withdraw Payment From Links And Update Status In Every 10 Seconds ----------------");
            const selectedPaymentLinks = await this.paymentLinkModel.aggregate([
                {
                    $match: {
                        status: payment_enum_1.PaymentStatus.PARTIALLY_SUCCESS,
                    },
                },
                {
                    $lookup: constants_1.paymentLink_And_App_lookupData,
                },
                {
                    $unwind: "$appDetail",
                },
                {
                    $project: constants_1.paymentLink_And_App_projectData,
                },
            ]);
            let partialSuccessWalletId = [];
            for (const wallet of selectedPaymentLinks) {
                partialSuccessWalletId.push(wallet?._id);
                const chainId = wallet?.chainId;
                const senderWalletAddress = wallet?.toAddress;
                const tokenContractAddress = wallet?.tokenAddress;
                const fullAmount = wallet?.recivedAmount;
                const tokenDecimal = wallet?.tokenDecimals ?? 18;
                const isFiat = wallet?.transactionType === "FIAT";
                const receiverAddress = isFiat
                    ? config_service_1.ConfigService.keys.EVM_OWNER_ADDRESS
                    : wallet?.appDetail?.EVMWalletMnemonic?.address;
                console.log({
                    "isFiat": isFiat,
                    "EVM_OWNER_ADDRESS": config_service_1.ConfigService.keys.EVM_OWNER_ADDRESS,
                    "receiverAddress": receiverAddress
                });
                console.log("receiverAddress change now ---------------> ", receiverAddress);
                const privateKey = this.encryptionService.decryptData(wallet?.privateKey);
                if (wallet?.tokenAddress === constants_1.NATIVE && chainId !== "TRON" && chainId !== "BTC") {
                    try {
                        let feeDetails = await this.adminService.getPlatformFee();
                        console.log("feeDetails : ---------- : ", feeDetails);
                        let nativeReceipt;
                        let paymentLinkCharges;
                        let paymentLinkWalletAddress;
                        if (feeDetails instanceof common_1.NotFoundException) {
                            throw Error;
                        }
                        else {
                            paymentLinkCharges = Number(feeDetails.data.platformFee ?? feeDetails.data.merchantFee ?? 0) || 0;
                            paymentLinkWalletAddress = feeDetails.data.adminWallet || feeDetails.data.merchantFeeWallet || "";
                            console.log("[EVM Native Withdraw] Resolved fee:", { paymentLinkCharges, paymentLinkWalletAddress });
                            const paymentLinkData = await this.paymentLinkModel.findOne({
                                _id: wallet?._id,
                            });
                            const currentWithdrawStatus = paymentLinkData.withdrawStatus;
                            nativeReceipt = await (0, evm_helper_1.evmNativeTokenTransferFromPaymentLinks)(chainId, privateKey, fullAmount, receiverAddress, tokenDecimal, paymentLinkCharges, paymentLinkWalletAddress, currentWithdrawStatus);
                        }
                        console.log("nativeReceipt ---*-*-* : ", nativeReceipt);
                        if (nativeReceipt?.adminReceipt) {
                            await this.updatePaymentLinkModel(wallet?._id, {
                                withdrawStatus: payment_enum_1.WithdrawPaymentStatus.ADMIN_CHARGES,
                                adminFee: nativeReceipt?.adminAmount,
                                adminFeeWallet: paymentLinkWalletAddress,
                            });
                        }
                        if (nativeReceipt?.merchantReceipt) {
                            await this.updatePaymentLinkModel(wallet?._id, {
                                withdrawStatus: payment_enum_1.WithdrawPaymentStatus.SUCCESS,
                                status: payment_enum_1.PaymentStatus.SUCCESS,
                                amountAfterTax: nativeReceipt?.merchantAmount,
                            });
                            const paymentLink = await this.paymentLinkModel.findById(wallet?._id);
                            if (paymentLink) {
                                await this.webhookService.sendWebhook(paymentLink.appId.toString(), paymentLink._id.toString(), webhook_log_schema_1.WebhookEvent.PAYMENT_SUCCESS, paymentLink.toObject());
                            }
                        }
                    }
                    catch (error) {
                        console.log("Error in evm native transafer from payment link : ", error.message);
                    }
                }
                else {
                    if (chainId !== "TRON") {
                        let feeDetails = await this.adminService.getPlatformFee();
                        let txCost;
                        let paymentLinkCharges;
                        let paymentLinkWalletAddress;
                        if (feeDetails instanceof common_1.NotFoundException) {
                            throw Error;
                        }
                        else {
                            paymentLinkCharges = Number(feeDetails.data.platformFee ?? feeDetails.data.merchantFee ?? 0) || 0;
                            paymentLinkWalletAddress = feeDetails.data.adminWallet || feeDetails.data.merchantFeeWallet || "";
                            console.log("[EVM ERC20 Withdraw] Resolved fee:", { paymentLinkCharges, paymentLinkWalletAddress });
                            const currentWithdrawStatus = wallet?.withdrawStatus;
                            const adminAlreadyCharged = currentWithdrawStatus === payment_enum_1.WithdrawPaymentStatus.ADMIN_CHARGES;
                            txCost = await (0, evm_helper_1.getERC20TxFee)(chainId, senderWalletAddress, receiverAddress, tokenContractAddress, fullAmount, tokenDecimal, paymentLinkCharges, paymentLinkWalletAddress, adminAlreadyCharged);
                        }
                        if (!txCost?.gasPrice) {
                            console.log("getERC20TxFee failed â€” gasPrice is null. Skipping this payment link for now.");
                            continue;
                        }
                        const gasBuffer = BigInt(3);
                        const nativeAmountForGas = BigInt(txCost.totalGas) * BigInt(txCost.gasPrice) * gasBuffer;
                        if (wallet?.withdrawStatus === payment_enum_1.WithdrawPaymentStatus.PENDING) {
                            let nativeTxReceipt = await (0, evm_helper_1.evmNativeTokenTransferToPaymentLinks)(chainId, nativeAmountForGas, senderWalletAddress);
                            if (!nativeTxReceipt) {
                                console.log("[EVM Gas] First gas funding attempt failed. Retrying with 5x buffer...");
                                const largerGas = BigInt(txCost.totalGas) * BigInt(txCost.gasPrice) * BigInt(5);
                                nativeTxReceipt = await (0, evm_helper_1.evmNativeTokenTransferToPaymentLinks)(chainId, largerGas, senderWalletAddress);
                            }
                            if (nativeTxReceipt) {
                                await this.updatePaymentLinkModel(wallet?._id, {
                                    withdrawStatus: payment_enum_1.WithdrawPaymentStatus.NATIVE_TRANSFER,
                                });
                            }
                            else {
                                console.error(`[EVM Gas] âŒ Gas funding failed for ${senderWalletAddress}. Will retry next cycle.`);
                                continue;
                            }
                        }
                        if (wallet?.withdrawStatus === payment_enum_1.WithdrawPaymentStatus.ADMIN_CHARGES) {
                            console.log("Sending additional native ETH for merchant transfer gas...");
                            const nativeTxReceipt = await (0, evm_helper_1.evmNativeTokenTransferToPaymentLinks)(chainId, nativeAmountForGas, senderWalletAddress);
                            if (!nativeTxReceipt) {
                                console.log("Failed to send additional gas for merchant transfer. Will retry next cycle.");
                                continue;
                            }
                        }
                        try {
                            const currentWithdrawStatus = wallet?.withdrawStatus;
                            const adminAlreadyCharged = currentWithdrawStatus === payment_enum_1.WithdrawPaymentStatus.ADMIN_CHARGES;
                            const erc20Receipt = await (0, evm_helper_1.evmERC20TokenTransfer)(chainId, privateKey, txCost, tokenContractAddress, fullAmount, receiverAddress, tokenDecimal, paymentLinkCharges, paymentLinkWalletAddress, adminAlreadyCharged);
                            if (erc20Receipt.receipt1) {
                                const adminFeeValue = fullAmount / (1 + parseFloat(paymentLinkCharges) / 100);
                                const adminFeeAmount = fullAmount - adminFeeValue;
                                const amountAfterTaxValue = fullAmount - adminFeeAmount;
                                await this.updatePaymentLinkModel(wallet?._id, {
                                    withdrawStatus: payment_enum_1.WithdrawPaymentStatus.ADMIN_CHARGES,
                                    adminFee: adminFeeAmount,
                                    adminFeeWallet: paymentLinkWalletAddress,
                                    amountAfterTax: amountAfterTaxValue,
                                });
                            }
                            if (erc20Receipt.receipt2) {
                                await this.updatePaymentLinkModel(wallet?._id, {
                                    withdrawStatus: payment_enum_1.WithdrawPaymentStatus.SUCCESS,
                                    status: payment_enum_1.PaymentStatus.SUCCESS,
                                });
                                const paymentLink = await this.paymentLinkModel.findById(wallet?._id);
                                if (paymentLink) {
                                    await this.webhookService.sendWebhook(paymentLink.appId.toString(), paymentLink._id.toString(), webhook_log_schema_1.WebhookEvent.PAYMENT_SUCCESS, paymentLink.toObject());
                                }
                            }
                        }
                        catch (error) {
                            console.log("An error occurred:", error.message);
                        }
                    }
                }
            }
        }
        catch (error) {
            console.log("An error occurred in withdrawPaymentFromLinksAndUpdateStatus : ", error);
        }
    }
    async checkWalletTx(walletAddress, contractAddress, chainId, txAmount) {
        let result = null;
        console.log("checking wallet tx : ", {
            walletAddress,
            contractAddress,
            chainId,
            txAmount,
        });
        const forPaymentLink = {
            toAddress: { $regex: new RegExp(`^${walletAddress}$`, "i") },
            status: payment_enum_1.PaymentStatus.PENDING,
            chainId: chainId,
            tokenAddress: { $regex: new RegExp(`^${contractAddress}$`, "i") },
        };
        console.log("forPaymentLink : ", forPaymentLink);
        const paymentLink = await this.paymentLinkModel.findOne(forPaymentLink);
        let toleranceMargin = 0;
        if (paymentLink) {
            const appForLink = await this.appModel.findById(paymentLink.appId);
            toleranceMargin = appForLink?.toleranceMargin || 0;
        }
        const app = await this.appModel.findOne({
            "EVMWalletMnemonic.address": {
                $regex: new RegExp(`^${walletAddress}$`, "i"),
            },
        });
        const minRequiredAmount = paymentLink
            ? parseFloat(paymentLink.amount) * (1 - (toleranceMargin / 100))
            : 0;
        const previousReceived = paymentLink ? parseFloat(paymentLink.recivedAmount || "0") : 0;
        const accumulatedAmount = previousReceived + parseFloat(txAmount);
        if (paymentLink && accumulatedAmount >= minRequiredAmount) {
            console.log("this is a payment link tx ----------");
            result = {
                _id: paymentLink?._id,
                id: paymentLink?.appId,
                transactionType: "PAYMENT_LINK",
                accumulatedAmount: accumulatedAmount
            };
            return result;
        }
        else if (paymentLink && accumulatedAmount > 0) {
            console.log("this is a partial payment link tx ----------");
            result = {
                _id: paymentLink?._id,
                id: paymentLink?.appId,
                transactionType: "PARTIAL_PAYMENT_LINK",
                accumulatedAmount: accumulatedAmount
            };
            return result;
        }
        else if (app) {
            console.log("this is a app  tx ----------");
            result = {
                _id: app?._id,
                id: app?._id,
                transactionType: "APP",
            };
            return result;
        }
        else {
            console.log("this is a null tx ----------");
            return result;
        }
    }
    async getTransactions(query) {
        try {
            const { pageNo, limitVal, search } = query;
            const page = pageNo ? parseInt(pageNo) : 1;
            const limit = limitVal ? parseInt(limitVal) : 10;
            let queryObject = {};
            if (search) {
                queryObject = {
                    $or: [
                        { toAddress: { $regex: search, $options: "i" } },
                        { appsId: search },
                    ],
                };
            }
            const transactions = await this.transactionModel
                .find(queryObject)
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ _id: -1 });
            const count = await this.transactionModel.countDocuments(queryObject);
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
    async updatePaymentLinkModel(id, updateFields) {
        try {
            await this.paymentLinkModel.updateOne({ _id: id }, { $set: updateFields });
            return true;
        }
        catch (error) {
            console.error("Error updating document: ", error);
            return false;
        }
    }
    async tronPaymentLink() {
        try {
            this.logger.debug("-------------- Cron Job -> TRON Payment Link Fallback Check (every 5 min) ----------------");
            const paymentLinks = await this.paymentLinkModel.find({
                status: payment_enum_1.PaymentStatus.PENDING,
                chainId: { $in: ["TRON"] },
            });
            if (!paymentLinks || paymentLinks?.length === 0) {
                return;
            }
            const trc20FilteredPaymentLinks = paymentLinks.filter((value) => value.code !== "TRX");
            const tronFilteredPaymentLinks = paymentLinks.filter((value) => value.code === "TRX");
            let updatedPaymentLinks = [];
            const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
            for (const link of tronFilteredPaymentLinks) {
                let status = {
                    recivedAmount: undefined,
                    status: undefined,
                    hash: undefined,
                    fromAddress: undefined,
                };
                if (link?.tokenAddress === constants_1.NATIVE) {
                    const app = await this.appModel.findById(link?.appId);
                    const toleranceMargin = app?.toleranceMargin || 0;
                    const minRequiredAmountTRX = Number(link?.amount) * (1 - (toleranceMargin / 100));
                    const tronBalance = await (0, tron_helper_2.getTronBalance)(link?.toAddress);
                    if (tronBalance > 0) {
                        const transactions = await (0, tron_helper_1.getTronTransactions)(link?.toAddress);
                        const paymentLinkCreationTime = new Date(link['createdAt']).getTime();
                        const recentTx = transactions?.data?.data
                            .filter((tx) => tx?.block_timestamp > paymentLinkCreationTime)
                            .sort((a, b) => b?.block_timestamp - a?.block_timestamp)[0];
                        if (recentTx) {
                            const toAddress = recentTx?.raw_data?.contract[0]?.parameter?.value?.to_address;
                            const toAddressInHex = await (0, tron_helper_1.hexToTronAddress)(toAddress?.slice(2, 42));
                            if (toAddressInHex === link?.toAddress) {
                                const fromAddress = recentTx?.raw_data?.contract[0]?.parameter?.value?.owner_address;
                                status.hash = await recentTx?.txID;
                                status.fromAddress = await (0, tron_helper_1.hexToTronAddress)(fromAddress.slice(2, 42));
                                status.recivedAmount = tronBalance;
                                if (tronBalance >= minRequiredAmountTRX) {
                                    status.status = payment_enum_1.PaymentStatus.PARTIALLY_SUCCESS;
                                }
                                else {
                                    status.status = payment_enum_1.PaymentStatus.PENDING;
                                }
                                const updatedLink = await this.paymentLinkModel.findOneAndUpdate({ _id: link?._id }, { $set: status }, { new: true });
                                if (updatedLink && status.status === payment_enum_1.PaymentStatus.PARTIALLY_SUCCESS) {
                                    updatedPaymentLinks.push(updatedLink);
                                    await this.webhookService.sendWebhook(updatedLink.appId.toString(), updatedLink._id.toString(), webhook_log_schema_1.WebhookEvent.PAYMENT_CONFIRMED, {
                                        ...updatedLink.toObject(),
                                        status: payment_enum_1.PaymentStatus.PARTIALLY_SUCCESS,
                                        hash: status.hash,
                                        fromAddress: status.fromAddress,
                                        recivedAmount: status.recivedAmount,
                                    });
                                }
                            }
                        }
                    }
                }
                await delay(1000);
            }
            for (const link of trc20FilteredPaymentLinks) {
                let status = {
                    recivedAmount: undefined,
                    status: undefined,
                    hash: undefined,
                    fromAddress: undefined,
                };
                if (link?.tokenAddress !== constants_1.NATIVE) {
                    const app = await this.appModel.findById(link?.appId);
                    const toleranceMargin = app?.toleranceMargin || 0;
                    const tronValueInDecimal = Number(link?.amount) * tron_helper_1.tronDecimal;
                    const minRequiredAmount = tronValueInDecimal * (1 - (toleranceMargin / 100));
                    const decryptPrivateKey = await this.encryptionService.decryptData(link?.privateKey);
                    const tronBalance = await (0, tron_helper_1.getTRC20Balance)([link], decryptPrivateKey);
                    for (const e of tronBalance) {
                        const trc20balanceAmount = await e.balance;
                        const minRequiredBalance = Number(link?.amount) * (1 - (toleranceMargin / 100));
                        if (Number(trc20balanceAmount) > 0) {
                            const transactions = await (0, tron_helper_1.getTRC20Transactions)(link?.toAddress);
                            const paymentLinkCreationTime = new Date(link['createdAt']).getTime();
                            const recentTx = transactions?.data?.data
                                .filter((tx) => tx?.block_timestamp > paymentLinkCreationTime)
                                .sort((a, b) => b?.block_timestamp - a?.block_timestamp)[0];
                            if (recentTx) {
                                const toAddress = await recentTx?.to;
                                if (toAddress === link?.toAddress) {
                                    const fromAddress = await recentTx?.from;
                                    status.hash = await recentTx?.transaction_id;
                                    status.fromAddress = await fromAddress;
                                    status.recivedAmount = Number(trc20balanceAmount);
                                    if (Number(trc20balanceAmount) >= minRequiredBalance) {
                                        status.status = payment_enum_1.PaymentStatus.PARTIALLY_SUCCESS;
                                    }
                                    else {
                                        status.status = payment_enum_1.PaymentStatus.PENDING;
                                    }
                                    const updatedLink = await this.paymentLinkModel.findOneAndUpdate({ _id: link?._id }, { $set: status }, { new: true });
                                    if (updatedLink && status.status === payment_enum_1.PaymentStatus.PARTIALLY_SUCCESS) {
                                        updatedPaymentLinks.push(updatedLink);
                                        await this.webhookService.sendWebhook(updatedLink.appId.toString(), updatedLink._id.toString(), webhook_log_schema_1.WebhookEvent.PAYMENT_CONFIRMED, {
                                            ...updatedLink.toObject(),
                                            status: payment_enum_1.PaymentStatus.PARTIALLY_SUCCESS,
                                            hash: status.hash,
                                            fromAddress: status.fromAddress,
                                            recivedAmount: status.recivedAmount,
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                await delay(1000);
            }
        }
        catch (error) {
            console.error("An error occurred:", error.message);
        }
    }
    async withdrawTronPaymentFromLinks() {
        try {
            this.logger.debug("--------------------- Cron Job Started for every 2 minutes (To withdraw tron amount from payment links) -----------------------");
            const partialPaymentLinks = await this.paymentLinkModel.aggregate([
                {
                    $match: {
                        status: payment_enum_1.PaymentStatus.PARTIALLY_SUCCESS,
                        chainId: { $in: ["TRON"] },
                    },
                },
                {
                    $lookup: constants_1.paymentLink_And_App_lookupData,
                },
                {
                    $unwind: "$appDetail",
                },
                {
                    $addFields: {
                        tronWallet: "$appDetail.TronWalletMnemonic.address",
                    },
                },
                {
                    $project: {
                        appDetail: 0,
                    },
                },
            ]);
            const adminData = await this.adminModel.find();
            if (!partialPaymentLinks || partialPaymentLinks.length === 0) {
                return;
            }
            for (const link of partialPaymentLinks) {
                const appForLink = await this.appModel.findById(link?.appId);
                const toleranceMargin = appForLink?.toleranceMargin || 0;
                const minRequiredAmount = Number(link?.amount) * (1 - (toleranceMargin / 100));
                if (link?.recivedAmount >= minRequiredAmount) {
                    let status = {
                        status: undefined,
                        withdrawStatus: undefined,
                        adminFee: undefined,
                        adminFeeWallet: undefined,
                        amountAfterTax: undefined,
                    };
                    const decryptedPrivateKey = await this.encryptionService.decryptData(link?.privateKey);
                    const totalAmount = Number(String(link?.recivedAmount ?? 0));
                    const decimals = Number(String(link?.tokenDecimals ?? 6));
                    if (isNaN(totalAmount) || isNaN(decimals) || totalAmount <= 0) {
                        console.error(`[TRON Withdraw] âŒ Invalid amount data for link ${link?._id}: ` +
                            `recivedAmount=${link?.recivedAmount} (parsed: ${totalAmount}), ` +
                            `tokenDecimals=${link?.tokenDecimals} (parsed: ${decimals}). Skipping.`);
                        continue;
                    }
                    let merchantAddress = "";
                    const isFiat = link?.transactionType === "FIAT";
                    merchantAddress = isFiat
                        ? config_service_1.ConfigService.keys.TRON_OWNER_ADDRESS
                        : await link?.tronWallet;
                    const tokenContractAddress = await link?.tokenAddress;
                    const paymentLinkAddress = await link?.toAddress;
                    const adminAddress = adminData[0]?.tronAdminWallet;
                    const adminCharges = adminData[0]?.tronPlatformFee ?? 0;
                    const adminPvtKey = config_service_1.ConfigService.keys.TRON_ADMIN_PRIVATE_KEY;
                    let merchantAmount = Number(totalAmount / (1 + adminCharges / 100));
                    let adminAmount = Number(totalAmount - merchantAmount);
                    console.log("[TRON Withdraw] Calculated amounts:", {
                        linkId: link?._id,
                        totalAmount,
                        decimals,
                        adminCharges,
                        merchantAmount,
                        adminAmount,
                        merchantAddress,
                        tokenContractAddress,
                    });
                    const isStablecoinTron = ["USDT", "USDC"].includes(link?.tokenSymbol?.toUpperCase());
                    const minTronAdminFee = isStablecoinTron ? 5 : 1;
                    if (adminAmount > 0 && adminAmount < minTronAdminFee) {
                        console.log(`[TRON Deposit Fee] â­ï¸ SKIPPING dust admin fee: ${adminAmount.toFixed(6)} ${link?.tokenSymbol || 'TRX'} ` +
                            `(threshold: ${minTronAdminFee}). Giving full amount to merchant.`);
                        merchantAmount = totalAmount;
                        adminAmount = 0;
                    }
                    if (link?.tokenAddress === constants_1.NATIVE) {
                        let transferTronToMerchant;
                        let transferTronToAdmin;
                        if (status.withdrawStatus !== payment_enum_1.WithdrawPaymentStatus.NATIVE_TRANSFER) {
                            const merchantReceiver = isFiat
                                ? config_service_1.ConfigService.keys.TRON_OWNER_ADDRESS
                                : merchantAddress;
                            console.log("merchantReceiver 11", merchantReceiver);
                            transferTronToMerchant = await (0, tron_helper_1.transferTron)(decryptedPrivateKey, constants_1.NATIVE, merchantReceiver, merchantAmount, decimals);
                            console.log("transferTronToMerchant 000 ", transferTronToMerchant);
                            console.log("transferTronToMerchant", transferTronToMerchant.result);
                            if (transferTronToMerchant.result) {
                                status.withdrawStatus = payment_enum_1.WithdrawPaymentStatus.NATIVE_TRANSFER;
                            }
                        }
                        if (status.withdrawStatus !== payment_enum_1.WithdrawPaymentStatus.ADMIN_CHARGES) {
                            if (adminAmount <= 0) {
                                console.log("[TRON Deposit] Admin fee is 0, skipping admin transfer.");
                                if (transferTronToMerchant?.result) {
                                    status.amountAfterTax = merchantAmount.toFixed(6);
                                    status.withdrawStatus = payment_enum_1.WithdrawPaymentStatus.SUCCESS;
                                    status.status = payment_enum_1.PaymentStatus.SUCCESS;
                                }
                            }
                            else {
                                console.log("324", status.withdrawStatus);
                                transferTronToAdmin = await (0, tron_helper_1.transferTron)(decryptedPrivateKey, constants_1.NATIVE, adminAddress, adminAmount, decimals);
                                console.log("transferTronToAdmin.result", transferTronToAdmin.result);
                                if (transferTronToAdmin.result) {
                                    status.adminFee = adminAmount.toFixed(6);
                                    status.adminFeeWallet = adminAddress;
                                    status.withdrawStatus = payment_enum_1.WithdrawPaymentStatus.ADMIN_CHARGES;
                                }
                                if (transferTronToAdmin.result && transferTronToMerchant.result) {
                                    status.amountAfterTax = merchantAmount.toFixed(6);
                                    status.withdrawStatus = payment_enum_1.WithdrawPaymentStatus.SUCCESS;
                                    status.status = payment_enum_1.PaymentStatus.SUCCESS;
                                }
                            }
                            const updatedLink = await this.paymentLinkModel.findOneAndUpdate({ _id: link?._id }, { $set: status }, { new: true });
                            if (updatedLink && status.status === payment_enum_1.PaymentStatus.SUCCESS) {
                                await this.webhookService.sendWebhook(updatedLink.appId.toString(), updatedLink._id.toString(), webhook_log_schema_1.WebhookEvent.PAYMENT_SUCCESS, updatedLink.toObject());
                                if (link?.tatumSubscriptionId) {
                                    try {
                                        const { unsubscribeTronAddressWebhook } = require("../helpers/tatum-tron.helper");
                                        await unsubscribeTronAddressWebhook(link.tatumSubscriptionId);
                                    }
                                    catch (e) {
                                        console.error("[Tatum] Failed to unsubscribe (non-blocking):", e.message);
                                    }
                                }
                            }
                        }
                    }
                    else {
                        let transferTronToMerchant;
                        let transferTronToAdmin;
                        const merchantReceiver = isFiat
                            ? config_service_1.ConfigService.keys.TRON_OWNER_ADDRESS
                            : merchantAddress;
                        const amountInSmallestUnit = (0, helper_1.toWeiCustom)(Number(merchantAmount.toFixed(6)).toString(), decimals);
                        const gasResult = await (0, tron_helper_1.estimateAndFundTrc20Gas)(paymentLinkAddress, tokenContractAddress, merchantReceiver, amountInSmallestUnit, adminPvtKey);
                        if (!gasResult.funded) {
                            console.error(`[TRON Withdraw] âŒ Gas funding failed for ${paymentLinkAddress}. ` +
                                `Needed: ${gasResult.trxNeeded} TRX, Has: ${gasResult.balance} TRX. Will retry next cycle.`);
                            continue;
                        }
                        let paymentLinkNativeBalance = gasResult.balance;
                        if (status.withdrawStatus !== payment_enum_1.WithdrawPaymentStatus.NATIVE_TRANSFER) {
                            console.log("[TRON Withdraw] Transferring TRC-20 to merchant:", merchantReceiver);
                            transferTronToMerchant = await (0, tron_helper_1.transferTron)(decryptedPrivateKey, tokenContractAddress, merchantReceiver, Number(merchantAmount.toFixed(6)), decimals);
                            if (transferTronToMerchant.length === 64) {
                                status.withdrawStatus = payment_enum_1.WithdrawPaymentStatus.NATIVE_TRANSFER;
                            }
                        }
                        if (adminAmount <= 0) {
                            if (transferTronToMerchant?.length === 64) {
                                console.log("[TRON TRC-20 Deposit] Admin fee is 0, skipping admin transfer.");
                                status.amountAfterTax = merchantAmount.toFixed(6);
                                status.withdrawStatus = payment_enum_1.WithdrawPaymentStatus.SUCCESS;
                                status.status = payment_enum_1.PaymentStatus.SUCCESS;
                            }
                        }
                        else {
                            if (status.withdrawStatus !== payment_enum_1.WithdrawPaymentStatus.ADMIN_CHARGES) {
                                const adminAmountSmallest = (0, helper_1.toWeiCustom)(Number(adminAmount.toFixed(6)).toString(), decimals);
                                const adminGasResult = await (0, tron_helper_1.estimateAndFundTrc20Gas)(paymentLinkAddress, tokenContractAddress, adminAddress, adminAmountSmallest, adminPvtKey);
                                if (!adminGasResult.funded) {
                                    console.error(`[TRON Withdraw] âŒ Admin transfer gas funding failed. Will retry next cycle.`);
                                    break;
                                }
                                transferTronToAdmin = await (0, tron_helper_1.transferTron)(decryptedPrivateKey, tokenContractAddress, adminAddress, Number(adminAmount.toFixed(6)), decimals);
                                if (transferTronToAdmin.length === 64) {
                                    status.adminFee = adminAmount.toFixed(6);
                                    status.adminFeeWallet = adminAddress;
                                    status.withdrawStatus = payment_enum_1.WithdrawPaymentStatus.ADMIN_CHARGES;
                                }
                            }
                            if (transferTronToMerchant?.length === 64 &&
                                transferTronToAdmin?.length === 64) {
                                status.amountAfterTax = merchantAmount.toFixed(6);
                                status.withdrawStatus = payment_enum_1.WithdrawPaymentStatus.SUCCESS;
                                status.status = payment_enum_1.PaymentStatus.SUCCESS;
                            }
                        }
                    }
                    const updatedLink = await this.paymentLinkModel.findOneAndUpdate({ _id: link?._id }, { $set: status }, { new: true });
                    if (updatedLink && status.status === payment_enum_1.PaymentStatus.SUCCESS) {
                        await this.webhookService.sendWebhook(updatedLink.appId.toString(), updatedLink._id.toString(), webhook_log_schema_1.WebhookEvent.PAYMENT_SUCCESS, updatedLink.toObject());
                        if (link?.tatumSubscriptionId) {
                            try {
                                const { unsubscribeTronAddressWebhook } = require("../helpers/tatum-tron.helper");
                                await unsubscribeTronAddressWebhook(link.tatumSubscriptionId);
                            }
                            catch (e) {
                                console.error("[Tatum] Failed to unsubscribe (non-blocking):", e.message);
                            }
                        }
                    }
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
    async getTronBalanceAPI(query) {
        try {
            const { address, tokenAddress } = query;
            if (!address || !tokenAddress) {
                throw new common_1.NotFoundException("Address or tokenAddress or Private Key is not provided here.");
            }
            if (tokenAddress === constants_1.NATIVE) {
                const getBalance = await (0, tron_helper_2.getTronBalance)(address);
                return getBalance;
            }
            else {
                const getTokens = await this.tokenModel.find({
                    chainId: { $in: ["TRON"] },
                    code: { $nin: ["TRX"] },
                });
                if (!getTokens || getTokens?.length === 0) {
                    throw new common_1.NotFoundException("USDT tokens not found");
                }
                const getAppModel = await this.appModel.find();
                if (!getAppModel || getAppModel?.length === 0) {
                    throw new common_1.NotFoundException("USDT tokens not found");
                }
                let encryptedPvtKey;
                for (const obj of getAppModel) {
                    const getAddress = await obj?.TronWalletMnemonic?.address;
                    if (address === getAddress) {
                        encryptedPvtKey = await obj?.TronWalletMnemonic?.privateKey;
                    }
                }
                const decryptPrivateKey = await this.encryptionService.decryptData(encryptedPvtKey);
                const trc20Balance = await (0, tron_helper_1.getTRC20Balance)(getTokens, decryptPrivateKey);
                return trc20Balance;
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
    async transferTRONAPI(query) {
        try {
            const { tokenContractAddress, senderAddress, receiverAddress, amount, decimal, } = query;
            if (!tokenContractAddress ||
                !senderAddress ||
                !receiverAddress ||
                !amount ||
                !decimal) {
                throw new common_1.NotFoundException("Some Details is not provided here.");
            }
            const adminData = await this.adminModel.find();
            const getAppModel = await this.appModel.find();
            if (!getAppModel || getAppModel?.length === 0) {
                throw new common_1.NotFoundException("USDT tokens not found");
            }
            let encryptedPvtKey;
            for (const obj of getAppModel) {
                const getAddress = await obj?.TronWalletMnemonic?.address;
                if (senderAddress === getAddress) {
                    encryptedPvtKey = await obj?.TronWalletMnemonic?.privateKey;
                }
            }
            const getBalance = await (0, tron_helper_2.getTronBalance)(senderAddress);
            const decryptedPrivateKey = await this.encryptionService.decryptData(encryptedPvtKey);
            let transferAdminFee;
            let transferTronToUser;
            const nativeTransactionAmount = 12;
            const halfNativeTransactionAmount = nativeTransactionAmount / 2;
            const adminAddress = adminData[0]?.tronAdminWallet;
            const adminCharges = adminData[0]?.tronMerchantFee;
            const userAmount = Number(amount / (1 + adminCharges / 100));
            const adminAmount = Number(amount - userAmount);
            const getUSDTtokenAddressModel = await this.tokenModel.find({
                chainId: { $in: ["TRON"] },
                code: { $nin: ["TRX"] },
            });
            let getUSDTtokenAddress;
            for (let obj of getUSDTtokenAddressModel) {
                getUSDTtokenAddress = await obj.address;
            }
            if (tokenContractAddress === constants_1.NATIVE) {
                if (amount < getBalance) {
                    transferAdminFee = await (0, tron_helper_1.transferTron)(decryptedPrivateKey, tokenContractAddress, adminAddress, adminAmount, decimal);
                    if (!transferAdminFee.result) {
                        throw new common_1.NotFoundException("Unsufficient balance for transfer");
                    }
                    transferTronToUser = await (0, tron_helper_1.transferTron)(decryptedPrivateKey, tokenContractAddress, receiverAddress, userAmount, decimal);
                    if (!transferTronToUser.result) {
                        throw new common_1.NotFoundException("Unsufficient balance for transfer");
                    }
                    if (transferAdminFee.result && transferTronToUser.result) {
                        return {
                            message: "successfully transferred native amount",
                            transactions: {
                                adminTxId: transferAdminFee.txid,
                                adminTronAmount: adminAmount,
                                UserTxId: transferTronToUser.txid,
                                adminAddress: adminAddress,
                                userTronAmount: userAmount,
                            },
                        };
                    }
                }
            }
            else {
                const getBalanceWithRetry = async (address, retries = 5) => {
                    let balance = await (0, tron_helper_2.getTronBalance)(address);
                    for (let i = 0; i < retries && balance === null; i++) {
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                        balance = await (0, tron_helper_2.getTronBalance)(address);
                    }
                    return balance;
                };
                if (!getUSDTtokenAddressModel ||
                    getUSDTtokenAddressModel?.length === 0) {
                    throw new common_1.NotFoundException("USDT tokens not found");
                }
                let balanceOfNative = await getBalanceWithRetry(senderAddress);
                if (balanceOfNative >= nativeTransactionAmount) {
                    const trc20Balance = await (0, tron_helper_1.getTRC20Balance)(getUSDTtokenAddressModel, decryptedPrivateKey);
                    const getTronBalance = trc20Balance[0].balance;
                    if (amount <= getTronBalance) {
                        if (balanceOfNative >= halfNativeTransactionAmount) {
                            transferAdminFee = await (0, tron_helper_1.transferTron)(decryptedPrivateKey, tokenContractAddress, adminAddress, Number(adminAmount.toFixed(6)), decimal);
                        }
                        if (balanceOfNative >= halfNativeTransactionAmount) {
                            transferTronToUser = await (0, tron_helper_1.transferTron)(decryptedPrivateKey, tokenContractAddress, receiverAddress, Number(userAmount.toFixed(6)), decimal);
                        }
                        if (transferAdminFee.length !== 64 ||
                            transferTronToUser.length !== 64) {
                            throw new common_1.NotFoundException("Unsufficient balance for transfer");
                        }
                        else {
                            return {
                                message: "successfully transferred TRC20 amount",
                                transactions: {
                                    adminTxId: transferAdminFee,
                                    adminTronAmount: adminAmount,
                                    UserTxId: transferTronToUser,
                                    userTronAmount: userAmount,
                                    adminAddress: adminAddress,
                                },
                            };
                        }
                    }
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
    async processBitcoinPaymentLinks() {
        try {
            const paymentLinks = await this.monitorModel
                .find({
                chainId: constants_1.BTC_CHAIN_ID,
                tokenAddress: constants_1.NATIVE,
                walletType: wallet_monitor_enum_1.WalletType.PAYMENT_LINK,
                isExpiry: true,
                streamId: "",
            })
                .sort({ createdAt: -1 })
                .limit(50)
                .select("_id paymentLinkId walletAddress amount transactionType appId");
            let walletList = paymentLinks.map((item) => item.walletAddress);
            let walletTxList = [];
            if (walletList.length > 0) {
                try {
                    const response = await axios_1.default.post(constants_1.GET_BTC_TX_BATCH_URL, {
                        addresses: walletList,
                    }, {
                        headers: {
                            accept: "application/json",
                            "x-api-key": config_service_1.ConfigService.keys.TATUM_X_API_KEY,
                        },
                    });
                    walletTxList = response.data;
                }
                catch (error) {
                    console.log("Error fetching BTC balance:", error.message);
                }
            }
            const appIds = [...new Set(paymentLinks.map(p => p.appId))];
            const apps = await this.appModel.find({ _id: { $in: appIds } });
            const appMap = new Map();
            apps.forEach(app => appMap.set(app._id.toString(), app));
            const mergedData = paymentLinks.map((payment) => {
                console.log('payment 122', payment);
                const walletTx = walletTxList.find((wallet) => {
                    return wallet.address === payment.walletAddress;
                });
                return {
                    payment,
                    transactions: walletTx &&
                        Array.isArray(walletTx.transactions) &&
                        walletTx.transactions.length > 0
                        ? walletTx.transactions
                        : null,
                };
            });
            const finalOutput = [];
            const partialOutput = [];
            mergedData.forEach((element) => {
                let tx = {
                    id: element.payment._id,
                    paymentLinkId: element.payment.paymentLinkId,
                    txAmount: 0,
                    senderAddress: null,
                    paymentLinkWalletAddress: element.payment.walletAddress,
                    paymentLinkAmount: element.payment.amount,
                    block: null,
                    gas: null,
                    hash: null,
                    status: false,
                    isPartial: false,
                    transactionType: element.payment.transactionType,
                };
                console.log(element, "element2");
                if (element.transactions && element.transactions.length > 0) {
                    const app = appMap.get(element.payment.appId?.toString());
                    const toleranceMargin = app?.toleranceMargin || 0;
                    const minRequiredAmount = Number(tx.paymentLinkAmount) * (1 - (toleranceMargin / 100));
                    let accumulatedAmount = 0;
                    let latestBlock = null;
                    let latestHash = null;
                    let latestGas = null;
                    let latestSender = null;
                    element.transactions.forEach((transaction) => {
                        latestBlock = transaction.blockNumber;
                        latestGas = transaction.fee;
                        latestHash = transaction.hash;
                        if (transaction.inputs && transaction.inputs.length > 0) {
                            latestSender = transaction.inputs[0].coin.address;
                        }
                        transaction.outputs.forEach((output) => {
                            if (output.address === tx.paymentLinkWalletAddress) {
                                const outputAmount = output.value / 10 ** 8;
                                accumulatedAmount += Number(outputAmount);
                            }
                        });
                    });
                    if (accumulatedAmount > 0) {
                        tx.txAmount = accumulatedAmount;
                        tx.block = latestBlock;
                        tx.gas = latestGas;
                        tx.hash = latestHash;
                        tx.senderAddress = latestSender;
                        if (accumulatedAmount >= minRequiredAmount) {
                            tx.status = true;
                        }
                        else {
                            tx.isPartial = true;
                        }
                    }
                }
                if (tx.status) {
                    finalOutput.push(tx);
                }
                else if (tx.isPartial) {
                    partialOutput.push(tx);
                }
            });
            const allDetectedTxs = [...finalOutput, ...partialOutput];
            const bulkOperations = allDetectedTxs.map((item) => ({
                updateOne: {
                    filter: { _id: item.id },
                    update: {
                        $set: {
                            streamId: item.streamId || config_service_1.ConfigService.keys.WEB_STREAMER_ID,
                        },
                    },
                },
            }));
            if (bulkOperations.length > 0) {
                await this.monitorModel.bulkWrite(bulkOperations);
            }
            for (const item of finalOutput) {
                console.log("Processing full BTC payment: ", item);
                await this.paymentLinkModel.updateOne({ _id: item.paymentLinkId }, {
                    $set: {
                        status: payment_enum_1.PaymentStatus.PARTIALLY_SUCCESS,
                        block: item.block,
                        fromAddress: item.senderAddress,
                        gas: item.fee,
                        hash: item.hash,
                        recivedAmount: item.txAmount,
                        tokenDecimals: "8",
                        tokenName: "BTC",
                    },
                });
                const paymentLink = await this.paymentLinkModel.findById(item.paymentLinkId);
                if (paymentLink) {
                    await this.webhookService.sendWebhook(paymentLink.appId.toString(), paymentLink._id.toString(), webhook_log_schema_1.WebhookEvent.PAYMENT_CONFIRMED, {
                        ...paymentLink.toObject(),
                        status: payment_enum_1.PaymentStatus.PARTIALLY_SUCCESS,
                        hash: item.hash,
                        fromAddress: item.senderAddress,
                        recivedAmount: item.txAmount,
                    });
                }
            }
            for (const item of partialOutput) {
                console.log("Processing partial BTC payment: ", item);
                await this.paymentLinkModel.updateOne({ _id: item.paymentLinkId }, {
                    $set: {
                        block: item.block,
                        fromAddress: item.senderAddress,
                        gas: item.fee,
                        hash: item.hash,
                        recivedAmount: item.txAmount,
                        tokenDecimals: "8",
                        tokenName: "BTC",
                    },
                });
            }
            this.logger.debug(`------------ Cron Job Started 1 MINUTE (To process btc payment) -------------- Full: ${finalOutput.length}, Partial: ${partialOutput.length}`);
            return finalOutput;
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
    async withdrawBTCPaymentFromLinksAndUpdateStatus() {
        try {
            const selectedBTCPaymentLinks = await this.paymentLinkModel.aggregate([
                {
                    $match: {
                        status: payment_enum_1.PaymentStatus.PARTIALLY_SUCCESS,
                        chainId: "BTC",
                    },
                },
                {
                    $lookup: constants_1.paymentLink_And_App_lookupData,
                },
                {
                    $unwind: "$appDetail",
                },
                {
                    $project: constants_1.btc_PaymentLink_And_App_projectData,
                },
            ]);
            if (!selectedBTCPaymentLinks || selectedBTCPaymentLinks.length === 0) {
                return [];
            }
            let btcAdminFeePercent = 0;
            let btcAdminWallet = null;
            try {
                const feeDetails = await this.adminService.getPlatformFee();
                if (feeDetails && !(feeDetails instanceof common_1.NotFoundException)) {
                    btcAdminFeePercent = parseFloat(String(feeDetails.data.btcMerchantFee)) || 0;
                    btcAdminWallet = feeDetails.data.btcAdminWallet || null;
                    console.log(`[BTC Withdraw] Admin fee: ${btcAdminFeePercent}%, Admin wallet: ${btcAdminWallet}`);
                }
            }
            catch (feeError) {
                console.log("[BTC Withdraw] Warning: Could not fetch platform fee, proceeding without admin fee split:", feeError.message);
            }
            let partialSuccessWalletId = [];
            for (const wallet of selectedBTCPaymentLinks) {
                partialSuccessWalletId.push(wallet?._id);
                const senderWalletAddress = wallet?.toAddress;
                const fullAmount = wallet?.recivedAmount;
                const isFiat = wallet?.transactionType?.toUpperCase?.() === "FIAT";
                const receiverAddress = isFiat
                    ? config_service_1.ConfigService.keys.BTC_OWNER_ADDRESS
                    : wallet?.appDetail?.BtcWalletMnemonic?.address;
                console.log({
                    "isFiat": isFiat,
                    "BTC_OWNER_ADDRESS": config_service_1.ConfigService.keys.BTC_OWNER_ADDRESS,
                    "receiverAddress": receiverAddress
                });
                const privateKey = this.encryptionService.decryptData(wallet?.privateKey);
                try {
                    console.log("ðŸš€ BTC Transfer Started");
                    console.log("Sender Wallet: ", senderWalletAddress);
                    console.log("Receiver Wallet: ", receiverAddress);
                    console.log("Full Amount: ", fullAmount);
                    console.log("is Fiat:", isFiat);
                    console.log("Admin Fee %:", btcAdminFeePercent);
                    console.log("Admin Wallet:", btcAdminWallet);
                    const tx = await (0, bitcoin_helper_1.btcTransferFromPaymentLinks)(privateKey, senderWalletAddress, receiverAddress, fullAmount, isFiat, config_service_1.ConfigService.keys.BTC_OWNER_ADDRESS, btcAdminFeePercent, btcAdminWallet);
                    if (tx?.txId) {
                        const updateFields = {
                            withdrawStatus: payment_enum_1.WithdrawPaymentStatus.SUCCESS,
                            status: payment_enum_1.PaymentStatus.SUCCESS,
                        };
                        if (tx.adminFeeSent && tx.adminFeeAmount > 0) {
                            updateFields.adminFee = tx.adminFeeAmount;
                            updateFields.adminFeeWallet = btcAdminWallet;
                            updateFields.amountAfterTax = tx.merchantAmount;
                            console.log(`âœ… BTC Admin fee recorded: ${tx.adminFeeAmount} BTC â†’ ${btcAdminWallet}`);
                        }
                        else {
                            updateFields.amountAfterTax = tx.merchantAmount || fullAmount;
                            if (btcAdminFeePercent > 0) {
                                console.log(`âš ï¸ BTC Admin fee was below dust limit. Full amount sent to merchant/owner.`);
                            }
                        }
                        await this.updatePaymentLinkModel(wallet?._id, updateFields);
                        const paymentLink = await this.paymentLinkModel.findById(wallet?._id);
                        if (paymentLink) {
                            await this.webhookService.sendWebhook(paymentLink.appId.toString(), paymentLink._id.toString(), webhook_log_schema_1.WebhookEvent.PAYMENT_SUCCESS, paymentLink.toObject());
                        }
                    }
                }
                catch (error) {
                    console.log("Error in BTC transfer from payment link: ", error.message);
                }
            }
            return partialSuccessWalletId;
        }
        catch (error) {
            console.log("An error occurred in withdrawBTCPaymentFromLinksAndUpdateStatus: ", error);
        }
    }
    async TRON_DIRECT_DEPOSIT_MONITOR() {
        try {
            const getAllAppsTronWallets = await this.appModel
                .find()
                .sort({ createdAt: -1 })
                .limit(50)
                .select("_id merchantId TronWalletMnemonic.address");
            if (getAllAppsTronWallets && getAllAppsTronWallets.length > 0) {
                const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
                const validWallets = getAllAppsTronWallets.filter((wallet) => wallet?.TronWalletMnemonic?.address);
                const tronWalletDataList = [];
                for (const wallet of validWallets) {
                    const tronWallet = wallet.TronWalletMnemonic.address;
                    const merchantId = wallet.merchantId;
                    try {
                        const tronWalletData = await (0, tron_helper_1.getTronToAddressAllTransactions)(tronWallet);
                        const trc20Transactions = (await (0, tron_helper_1.getTRC20Transactions)(tronWallet)).data;
                        if (tronWalletData?.success &&
                            tronWalletData?.data?.length > 0) {
                            for (const transaction of tronWalletData?.data) {
                                const hash = transaction?.txID;
                                const fAddress = transaction?.raw_data?.contract[0]?.parameter?.value
                                    ?.owner_address;
                                const tronFAddress = (await (0, tron_helper_1.hexToTronAddress)(fAddress.slice(2, 42))) || null;
                                const tAddress = transaction?.raw_data?.contract[0]?.parameter?.value
                                    ?.to_address;
                                const tronTAddress = (await (0, tron_helper_1.hexToTronAddress)(tAddress.slice(2, 42))) || null;
                                const existingTx = await this.merchantTxModel.findOne({
                                    hash,
                                });
                                const paymentLinks = await this.paymentLinkModel
                                    .find({
                                    status: payment_enum_1.PaymentStatus.SUCCESS,
                                    chainId: { $in: ["TRON"] },
                                })
                                    .select("toAddress");
                                const paymentLinkTxTypeCheck = async () => {
                                    let txTypeStatus;
                                    const paymentLink = await paymentLinks.map((PL) => PL?.toAddress === tronFAddress);
                                    for (const PL of paymentLink) {
                                        txTypeStatus = enum_1.TransactionTypes.DEPOSIT;
                                        if (PL) {
                                            txTypeStatus = enum_1.TransactionTypes.PAYMENT_LINKS;
                                        }
                                    }
                                    return txTypeStatus;
                                };
                                const txTypeOfPayment = await paymentLinkTxTypeCheck();
                                if (!existingTx) {
                                    const newTxData = {
                                        appsId: wallet._id,
                                        status: payment_enum_1.PaymentStatus.SUCCESS,
                                        recivedAmount: transaction?.raw_data?.contract[0]?.parameter?.value
                                            ?.amount /
                                            10 ** 6 || 0,
                                        hash,
                                        gas: 0,
                                        gasPrice: 0,
                                        fromAddress: tronFAddress,
                                        toAddress: tronTAddress,
                                        note: "Deposit funds",
                                        blockNumber: transaction?.blockNumber,
                                        chainId: constants_1.TRON_CHAIN_ID,
                                        symbol: "TRX",
                                        txType: txTypeOfPayment,
                                    };
                                    await this.merchantTxModel.create(newTxData);
                                }
                            }
                        }
                        if (trc20Transactions?.success &&
                            trc20Transactions?.data?.length > 0) {
                            for (const transaction of trc20Transactions?.data) {
                                const hash = transaction.transaction_id;
                                const fAddress = transaction?.from;
                                const tAddress = transaction?.to;
                                const existingTx = await this.merchantTxModel.findOne({
                                    hash,
                                });
                                const paymentLinks = await this.paymentLinkModel
                                    .find({
                                    status: payment_enum_1.PaymentStatus.SUCCESS,
                                    chainId: { $in: ["TRON"] },
                                })
                                    .select("toAddress");
                                const paymentLinkTxTypeCheck = async () => {
                                    let txTypeStatus;
                                    const paymentLink = await paymentLinks.map((PL) => PL?.toAddress === fAddress);
                                    for (const PL of paymentLink) {
                                        txTypeStatus = enum_1.TransactionTypes.DEPOSIT;
                                        if (PL) {
                                            txTypeStatus = enum_1.TransactionTypes.PAYMENT_LINKS;
                                        }
                                    }
                                    return txTypeStatus;
                                };
                                const txTypeOfPayment = await paymentLinkTxTypeCheck();
                                if (!existingTx) {
                                    const newTxData = {
                                        appsId: wallet._id,
                                        status: payment_enum_1.PaymentStatus.SUCCESS,
                                        recivedAmount: transaction?.value / 10 ** 6 || 0,
                                        hash,
                                        gas: 0,
                                        gasPrice: 0,
                                        fromAddress: fAddress,
                                        toAddress: tAddress,
                                        note: "Deposit funds",
                                        blockNumber: transaction?.blockNumber || 0,
                                        chainId: constants_1.TRON_CHAIN_ID,
                                        symbol: transaction?.token_info?.symbol || "USDT",
                                        txType: txTypeOfPayment,
                                    };
                                    await this.merchantTxModel.create(newTxData);
                                }
                            }
                        }
                        tronWalletDataList.push(null);
                    }
                    catch (error) {
                        console.error(`Error fetching Tron Wallet Data for Merchant ${merchantId}:`, error.message);
                        tronWalletDataList.push(null);
                    }
                    await delay(1000);
                }
                const validTronWalletData = tronWalletDataList.filter((data) => data !== null);
                return validTronWalletData;
            }
            else {
                console.log("No wallets found.");
                return [];
            }
        }
        catch (error) {
            console.error("An unexpected error occurred:", error.message);
            throw error instanceof common_1.NotFoundException
                ? error
                : new common_1.BadRequestException("Failed to monitor deposits");
        }
    }
    async BITCOIN_DIRECT_DEPOSIT_MONITOR() {
        try {
            const getAllAppsBtcWallets = await this.appModel
                .find()
                .sort({ createdAt: -1 })
                .limit(50)
                .select("_id merchantId BtcWalletMnemonic.address");
            const addressToAppsIdMap = getAllAppsBtcWallets.reduce((map, entry) => {
                const address = entry?.BtcWalletMnemonic?.address;
                if (address) {
                    map[address] = entry?._id.toString();
                }
                return map;
            }, {});
            const walletList = getAllAppsBtcWallets
                .map((entry) => entry?.BtcWalletMnemonic?.address)
                .filter((address) => {
                if (!address)
                    return false;
                if (config_service_1.ConfigService.keys.TATUM_NETWORK?.includes("mainnet") || config_service_1.ConfigService.keys.TATUM_NETWORK === "bitcoin") {
                    return address.startsWith("bc");
                }
                else {
                    return !address.startsWith("bc");
                }
            });
            let walletTxList = [];
            try {
                const url = "https://api.tatum.io/v3/bitcoin/transaction/address/batch";
                const payload = {
                    addresses: walletList,
                    txType: "incoming",
                };
                const headers = {
                    accept: "application/json",
                    "content-type": "application/json",
                    "x-api-key": config_service_1.ConfigService.keys.TATUM_X_API_KEY,
                };
                const response = await axios_1.default.post(url, payload, {
                    headers,
                });
                if (response?.data) {
                    walletTxList = response.data;
                }
                else {
                    console.log("No transaction data received in the response.");
                }
            }
            catch (error) {
                console.log("Error fetching transactions:", error.message);
            }
            const existingHashes = await this.merchantTxModel.distinct("hash");
            const output = walletTxList.flatMap(({ address, transactions }) => transactions
                .filter((transaction) => !existingHashes.includes(transaction.hash))
                .map((transaction) => ({
                transactions: {
                    appsId: addressToAppsIdMap[address] || "",
                    status: payment_enum_1.PaymentStatus.SUCCESS,
                    recivedAmount: transaction.inputs[0].coin.value / 10 ** 8,
                    hash: transaction.hash,
                    gas: transaction.fee,
                    gasPrice: 0,
                    fromAddress: transaction.inputs[0].coin.address,
                    toAddress: address,
                    note: "Deposit funds",
                    blockNumber: transaction.blockNumber,
                    chainId: constants_1.BTC_CHAIN_ID,
                    symbol: "BTC",
                },
            })));
            if (output.length > 0) {
                await this.merchantTxModel.insertMany(output.map((o) => o.transactions));
            }
            return output;
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
    async reclaimLeftoverFunds() {
        try {
            console.log("-------------- Cron Job -> Reclaim Leftover Funds (every 15 min) ----------------");
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            const completedLinks = await this.paymentLinkModel
                .find({
                status: payment_enum_1.PaymentStatus.SUCCESS,
                withdrawStatus: payment_enum_1.WithdrawPaymentStatus.SUCCESS,
                fundsReclaimed: { $ne: true },
                updatedAt: { $lt: tenMinutesAgo },
                chainId: { $ne: "BTC" },
            })
                .limit(10)
                .lean();
            if (completedLinks.length === 0) {
                return;
            }
            console.log(`[Reclaim] Found ${completedLinks.length} completed wallets to sweep`);
            for (const link of completedLinks) {
                try {
                    const chainId = link.chainId;
                    const tempAddress = link.toAddress;
                    const decryptedPrivateKey = this.encryptionService.decryptData(link.privateKey);
                    if (!decryptedPrivateKey) {
                        console.error(`[Reclaim] Cannot decrypt key for ${tempAddress}. Marking reclaimed.`);
                        await this.paymentLinkModel.updateOne({ _id: link._id }, { $set: { fundsReclaimed: true } });
                        continue;
                    }
                    console.log(`[Reclaim] Processing ${tempAddress} on chain ${chainId}...`);
                    if (chainId === "TRON") {
                        await this.reclaimTronFunds(tempAddress, decryptedPrivateKey, link);
                    }
                    else {
                        await this.reclaimEvmFunds(tempAddress, decryptedPrivateKey, chainId, link);
                    }
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
                catch (error) {
                    console.error(`[Reclaim] Error processing ${link.toAddress}:`, error.message);
                }
            }
        }
        catch (error) {
            console.error("[Reclaim] Cron error:", error.message);
        }
    }
    async reclaimTronFunds(tempAddress, privateKey, link) {
        const adminAddress = config_service_1.ConfigService.keys.TRON_ADMIN_ADDRESS;
        if (!adminAddress) {
            console.error("[Reclaim TRON] No TRON_ADMIN_ADDRESS configured.");
            return;
        }
        try {
            const tronNode = config_service_1.ConfigService.keys.TRON_NODE || "https://api.trongrid.io";
            const tronApiKey = config_service_1.ConfigService.keys.TRON_GRID_API_KEY;
            const trc20Url = `${tronNode}/v1/accounts/${tempAddress}/tokens/trc20?limit=50`;
            const reqHeaders = { accept: "application/json" };
            if (tronApiKey)
                reqHeaders["TRON-PRO-API-KEY"] = tronApiKey;
            const trc20Response = await axios_1.default.get(trc20Url, { headers: reqHeaders });
            const trc20Tokens = trc20Response?.data?.data || [];
            for (const token of trc20Tokens) {
                const tokenBalance = token.balance || "0";
                const tokenAddr = token.token_id || token.contract_address;
                const tokenDecimals = Number(token.token_decimal || 6);
                if (BigInt(tokenBalance) > BigInt(0) && tokenAddr) {
                    const humanAmount = Number(tokenBalance) / (10 ** tokenDecimals);
                    if (humanAmount < 1) {
                        console.log(`[Reclaim TRON] â­ï¸ Dust TRC-20: ${humanAmount} of ${tokenAddr} â€” skip (< $1)`);
                        continue;
                    }
                    const adminPvtKey = config_service_1.ConfigService.keys.TRON_ADMIN_PRIVATE_KEY;
                    if (!adminPvtKey)
                        continue;
                    const gasResult = await (0, tron_helper_1.estimateAndFundTrc20Gas)(tempAddress, tokenAddr, adminAddress, tokenBalance.toString(), adminPvtKey);
                    if (gasResult.trxNeeded > 0 && humanAmount < gasResult.trxNeeded * 0.15) {
                        console.log(`[Reclaim TRON] â­ï¸ Not profitable: ~$${humanAmount.toFixed(2)} < gas ~${gasResult.trxNeeded} TRX ($${(gasResult.trxNeeded * 0.15).toFixed(2)}). Skip.`);
                        continue;
                    }
                    if (gasResult.funded) {
                        try {
                            const txid = await (0, tron_helper_1.transferTron)(privateKey, tokenAddr, adminAddress, humanAmount, tokenDecimals);
                            console.log(`[Reclaim TRON] âœ… Swept ${humanAmount} TRC-20 (${tokenAddr}) â†’ ${adminAddress} | TX: ${txid}`);
                        }
                        catch (txErr) {
                            console.error(`[Reclaim TRON] TRC-20 transfer failed:`, txErr.message);
                        }
                    }
                }
            }
        }
        catch (trc20Error) {
            console.error(`[Reclaim TRON] TRC-20 sweep error:`, trc20Error.message);
        }
        try {
            const trxBalance = await (0, tron_helper_2.getTronBalance)(tempAddress);
            const MIN_TRX = 2;
            const SEND_FEE = 0.3;
            if (trxBalance && trxBalance > MIN_TRX) {
                const reclaimAmount = Number((trxBalance - SEND_FEE).toFixed(6));
                console.log(`[Reclaim TRON] Sweeping ${reclaimAmount} TRX â†’ ${adminAddress} (balance: ${trxBalance} TRX)`);
                const txResult = await (0, tron_helper_1.transferTron)(privateKey, constants_1.NATIVE, adminAddress, reclaimAmount, 6);
                if (txResult?.result || (typeof txResult === "string" && txResult.length === 64)) {
                    console.log(`[Reclaim TRON] âœ… Swept ${reclaimAmount} TRX â†’ ${adminAddress}`);
                }
            }
            else {
                console.log(`[Reclaim TRON] TRX balance ${trxBalance || 0} â€” below ${MIN_TRX} threshold. Skip.`);
            }
        }
        catch (trxError) {
            console.error(`[Reclaim TRON] TRX sweep error:`, trxError.message);
        }
        await this.paymentLinkModel.updateOne({ _id: link._id }, { $set: { fundsReclaimed: true } });
        console.log(`[Reclaim TRON] âœ… Marked ${tempAddress} as reclaimed.`);
    }
    async reclaimEvmFunds(tempAddress, privateKey, chainId, link) {
        const adminAddress = config_service_1.ConfigService.keys.ADMIN_WALLET_ADDRESS;
        if (!adminAddress) {
            console.error("[Reclaim EVM] No ADMIN_WALLET_ADDRESS configured.");
            return;
        }
        try {
            const web3 = await (0, evm_helper_1.getWeb3)(chainId);
            const account = web3.eth.accounts.privateKeyToAccount(privateKey);
            web3.eth.accounts.wallet.add(account);
            const tokenAddress = link.tokenAddress;
            if (tokenAddress && tokenAddress !== constants_1.NATIVE) {
                try {
                    const minABI = [
                        { constant: true, inputs: [{ name: "_owner", type: "address" }], name: "balanceOf", outputs: [{ name: "balance", type: "uint256" }], type: "function" },
                        { constant: false, inputs: [{ name: "_to", type: "address" }, { name: "_value", type: "uint256" }], name: "transfer", outputs: [{ name: "", type: "bool" }], type: "function" },
                        { constant: true, inputs: [], name: "decimals", outputs: [{ name: "", type: "uint8" }], type: "function" },
                    ];
                    const tokenContract = new web3.eth.Contract(minABI, tokenAddress);
                    const tokenBalance = await tokenContract.methods.balanceOf(account.address).call();
                    if (BigInt(String(tokenBalance)) > BigInt(0)) {
                        let tokenDecimals = 18;
                        try {
                            tokenDecimals = Number(await tokenContract.methods.decimals().call());
                        }
                        catch { }
                        const humanBalance = Number(tokenBalance) / (10 ** tokenDecimals);
                        if (humanBalance < 0.5) {
                            console.log(`[Reclaim EVM] â­ï¸ Dust ERC-20: ${humanBalance} of ${tokenAddress} on ${chainId} â€” skip`);
                        }
                        else {
                            const gasPrice = await web3.eth.getGasPrice();
                            const gas = await tokenContract.methods
                                .transfer(adminAddress, String(tokenBalance))
                                .estimateGas({ from: account.address });
                            const gasCostWei = BigInt(gas) * BigInt(gasPrice);
                            const gasCostEth = Number(web3.utils.fromWei(gasCostWei.toString(), "ether"));
                            if (humanBalance < 1 && gasCostEth > 0.001) {
                                console.log(`[Reclaim EVM] â­ï¸ Not profitable: ${humanBalance} tokens, gas ${gasCostEth.toFixed(6)} native. Skip.`);
                            }
                            else {
                                console.log(`[Reclaim EVM] Sweeping ERC-20 (${tokenAddress}): ${humanBalance} from ${tempAddress} on ${chainId}`);
                                const nativeBalance = await web3.eth.getBalance(account.address);
                                if (BigInt(nativeBalance) < gasCostWei * BigInt(2)) {
                                    console.log(`[Reclaim EVM] Funding gas for ERC-20 sweep...`);
                                    const deficit = gasCostWei * BigInt(2) - BigInt(nativeBalance);
                                    await (0, evm_helper_1.evmNativeTokenTransferToPaymentLinks)(chainId, deficit, account.address);
                                    await new Promise((resolve) => setTimeout(resolve, 3000));
                                }
                                const updatedBalance = await web3.eth.getBalance(account.address);
                                if (BigInt(updatedBalance) >= gasCostWei) {
                                    const nonce = await web3.eth.getTransactionCount(account.address, "pending");
                                    const tx = {
                                        from: account.address,
                                        to: tokenAddress,
                                        gas, gasPrice, nonce,
                                        data: tokenContract.methods.transfer(adminAddress, String(tokenBalance)).encodeABI(),
                                    };
                                    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
                                    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
                                    if (receipt?.status) {
                                        console.log(`[Reclaim EVM] âœ… Swept ERC-20 â†’ ${adminAddress} | TX: ${receipt.transactionHash}`);
                                    }
                                }
                            }
                        }
                    }
                }
                catch (tokenError) {
                    console.error(`[Reclaim EVM] ERC-20 sweep error:`, tokenError.message);
                }
            }
            const nativeBalance = await web3.eth.getBalance(account.address);
            const gasPrice = await web3.eth.getGasPrice();
            const gasLimit = BigInt(21000);
            const gasCostWei = gasLimit * BigInt(gasPrice);
            const minReclaim = gasCostWei * BigInt(3);
            if (BigInt(nativeBalance) > minReclaim) {
                const reclaimWei = BigInt(nativeBalance) - gasCostWei;
                console.log(`[Reclaim EVM] Sweeping ${web3.utils.fromWei(reclaimWei.toString(), "ether")} native â†’ ${adminAddress} ` +
                    `(gas: ${web3.utils.fromWei(gasCostWei.toString(), "ether")}) on ${chainId}`);
                const nonce = await web3.eth.getTransactionCount(account.address, "pending");
                const tx = {
                    from: account.address, to: adminAddress,
                    value: reclaimWei.toString(), gas: gasLimit.toString(), gasPrice, nonce,
                };
                const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
                const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
                if (receipt?.status) {
                    console.log(`[Reclaim EVM] âœ… Swept native â†’ ${adminAddress} | TX: ${receipt.transactionHash}`);
                }
            }
            else {
                console.log(`[Reclaim EVM] Native ${web3.utils.fromWei(nativeBalance, "ether")} on ${chainId} â€” not worth gas. Skip.`);
            }
        }
        catch (error) {
            console.error(`[Reclaim EVM] Error sweeping ${tempAddress}:`, error.message);
        }
        await this.paymentLinkModel.updateOne({ _id: link._id }, { $set: { fundsReclaimed: true } });
        console.log(`[Reclaim EVM] âœ… Marked ${tempAddress} as reclaimed.`);
    }
};
exports.TransactionService = TransactionService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionService.prototype, "deletePaymentLinksWhichIsNotExistAnymore", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionService.prototype, "deleteAppsWhichIsNotExistAnymore", null);
__decorate([
    (0, schedule_1.Cron)("*/10 * * * * *"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionService.prototype, "withdrawPaymentFromLinksAndUpdateStatus", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionService.prototype, "tronPaymentLink", null);
__decorate([
    (0, schedule_1.Cron)("*/2 * * * *"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionService.prototype, "withdrawTronPaymentFromLinks", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionService.prototype, "processBitcoinPaymentLinks", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionService.prototype, "withdrawBTCPaymentFromLinksAndUpdateStatus", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionService.prototype, "TRON_DIRECT_DEPOSIT_MONITOR", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionService.prototype, "BITCOIN_DIRECT_DEPOSIT_MONITOR", null);
__decorate([
    (0, schedule_1.Cron)("0 */15 * * * *"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionService.prototype, "reclaimLeftoverFunds", null);
exports.TransactionService = TransactionService = TransactionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)("Transaction")),
    __param(1, (0, mongoose_1.InjectModel)(wallet_monitor_schema_1.WalletMonitor.name)),
    __param(2, (0, mongoose_1.InjectModel)(payment_link_schema_1.PaymentLink.name)),
    __param(3, (0, mongoose_1.InjectModel)(apps_schema_1.Apps.name)),
    __param(4, (0, mongoose_1.InjectModel)(token_schema_1.Token.name)),
    __param(5, (0, mongoose_1.InjectModel)(admin_schema_1.Admin.name)),
    __param(6, (0, mongoose_1.InjectModel)(merchant_app_tx_schema_1.MerchantAppTx.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        admin_service_1.AdminService,
        encryption_service_1.EncryptionService,
        webhook_service_1.WebhookService])
], TransactionService);
//# sourceMappingURL=moralis-tx.service.js.map