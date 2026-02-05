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
                                recivedAmount: txAmount,
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
                                recivedAmount: txAmount,
                            });
                        }
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
                if (wallet?.tokenAddress === constants_1.NATIVE) {
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
                            paymentLinkCharges = feeDetails.data.merchantFee;
                            paymentLinkWalletAddress = feeDetails.data.merchantFeeWallet;
                            const paymentLinkData = await this.paymentLinkModel.findOne({
                                _id: wallet?._id,
                            });
                            const currentWithdrawStatus = paymentLinkData.withdrawStatus;
                            nativeReceipt = await (0, evm_helper_1.evmNativeTokenTransferFromPaymentLinks)(chainId, privateKey, fullAmount, receiverAddress, tokenDecimal, paymentLinkCharges, paymentLinkWalletAddress, currentWithdrawStatus);
                        }
                        console.log("nativeReceipt ---*-*-* : ", nativeReceipt);
                        if (nativeReceipt.adminReceipt) {
                            await this.updatePaymentLinkModel(wallet?._id, {
                                withdrawStatus: payment_enum_1.WithdrawPaymentStatus.ADMIN_CHARGES,
                                adminFee: nativeReceipt?.adminAmount,
                                adminFeeWallet: paymentLinkWalletAddress,
                            });
                        }
                        if (nativeReceipt.merchantReceipt) {
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
                    let feeDetails = await this.adminService.getPlatformFee();
                    let txCost;
                    let paymentLinkCharges;
                    let paymentLinkWalletAddress;
                    if (feeDetails instanceof common_1.NotFoundException) {
                        throw Error;
                    }
                    else {
                        paymentLinkCharges = feeDetails.data.merchantFee;
                        paymentLinkWalletAddress = feeDetails.data.merchantFeeWallet;
                        txCost = await (0, evm_helper_1.getERC20TxFee)(chainId, senderWalletAddress, receiverAddress, tokenContractAddress, fullAmount, tokenDecimal, paymentLinkCharges, paymentLinkWalletAddress);
                    }
                    if (wallet?.withdrawStatus === payment_enum_1.WithdrawPaymentStatus.PENDING) {
                        const nativeTxReceipt = await (0, evm_helper_1.evmNativeTokenTransferToPaymentLinks)(chainId, txCost?.totalGas * txCost?.gasPrice, senderWalletAddress);
                        if (nativeTxReceipt) {
                            await this.updatePaymentLinkModel(wallet?._id, {
                                withdrawStatus: payment_enum_1.WithdrawPaymentStatus.NATIVE_TRANSFER,
                            });
                        }
                    }
                    try {
                        const erc20Receipt = await (0, evm_helper_1.evmERC20TokenTransfer)(chainId, privateKey, txCost, tokenContractAddress, fullAmount, receiverAddress, tokenDecimal, paymentLinkCharges, paymentLinkWalletAddress);
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
        const app = await this.appModel.findOne({
            "EVMWalletMnemonic.address": {
                $regex: new RegExp(`^${walletAddress}$`, "i"),
            },
        });
        if (paymentLink && parseFloat(txAmount) >= parseFloat(paymentLink.amount)) {
            console.log("this is a payment link tx ----------");
            result = {
                _id: paymentLink?._id,
                id: paymentLink?.appId,
                transactionType: "PAYMENT_LINK",
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
            this.logger.debug("-------------- Cron Job -> Payment Link Status Update In Every 10 Seconds ----------------");
            const paymentLinks = await this.paymentLinkModel.find({
                status: payment_enum_1.PaymentStatus.PENDING,
                chainId: { $in: ["TRON"] },
            });
            if (!paymentLinks || paymentLinks?.length === 0) {
                throw new common_1.NotFoundException("Payment link not found or not pending from buyer side");
            }
            const trc20FilteredPaymentLinks = paymentLinks.filter((value) => value.code !== "TRX");
            const tronFilteredPaymentLinks = paymentLinks.filter((value) => value.code === "TRX");
            let updatedPaymentLinks = [];
            for (const link of tronFilteredPaymentLinks) {
                let status = {
                    recivedAmount: undefined,
                    status: undefined,
                    hash: undefined,
                    fromAddress: undefined,
                };
                if (link?.tokenAddress === constants_1.NATIVE) {
                    const tronValueInDecimal = Number(link?.amount) * tron_helper_1.tronDecimal;
                    const tronBalance = await (0, tron_helper_2.getTronBalance)(link?.toAddress);
                    if (tronBalance >= Number(link.amount)) {
                        const transactions = await (0, tron_helper_1.getTronTransactions)(link?.toAddress);
                        const paymentLinkCreationTime = new Date(link['createdAt']).getTime();
                        const matchingTransaction = transactions?.data?.data
                            .filter((tx) => {
                            const isAmountMatch = tx?.raw_data?.contract[0]?.parameter?.value?.amount >= tronValueInDecimal;
                            const isTimeMatch = tx?.block_timestamp > paymentLinkCreationTime;
                            return isAmountMatch && isTimeMatch;
                        })
                            .sort((a, b) => b?.block_timestamp - a?.block_timestamp)[0];
                        if (matchingTransaction) {
                            const toAddress = await matchingTransaction?.raw_data?.contract[0]?.parameter
                                ?.value?.to_address;
                            const toAddressInHex = await (0, tron_helper_1.hexToTronAddress)(toAddress?.slice(2, 42));
                            if (toAddressInHex === link?.toAddress) {
                                const fromAddress = await matchingTransaction?.raw_data.contract[0]?.parameter
                                    ?.value?.owner_address;
                                status.hash = await matchingTransaction?.txID;
                                status.fromAddress = await (0, tron_helper_1.hexToTronAddress)(fromAddress.slice(2, 42));
                                status.recivedAmount =
                                    (await matchingTransaction?.raw_data.contract[0]?.parameter
                                        ?.value?.amount) / tron_helper_1.tronDecimal;
                                status.status = payment_enum_1.PaymentStatus.PARTIALLY_SUCCESS;
                                const updatedLink = await this.paymentLinkModel.findOneAndUpdate({ _id: link?._id }, { $set: status }, { new: true });
                                if (updatedLink) {
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
            for (const link of trc20FilteredPaymentLinks) {
                let status = {
                    recivedAmount: undefined,
                    status: undefined,
                    hash: undefined,
                    fromAddress: undefined,
                };
                if (link?.tokenAddress !== constants_1.NATIVE) {
                    const tronValueInDecimal = Number(link?.amount) * tron_helper_1.tronDecimal;
                    const decryptPrivateKey = await this.encryptionService.decryptData(link?.privateKey);
                    const tronBalance = await (0, tron_helper_1.getTRC20Balance)(trc20FilteredPaymentLinks, decryptPrivateKey);
                    for (const e of tronBalance) {
                        const trc20balanceAmount = await e.balance;
                        if (Number(trc20balanceAmount) >= Number(link?.amount)) {
                            const transactions = await (0, tron_helper_1.getTRC20Transactions)(link?.toAddress);
                            const paymentLinkCreationTime = new Date(link['createdAt']).getTime();
                            const matchingTransaction = transactions?.data?.data
                                .filter((tx) => {
                                const isAmountMatch = tx?.value >= tronValueInDecimal;
                                const isTimeMatch = tx?.block_timestamp > paymentLinkCreationTime;
                                return isAmountMatch && isTimeMatch;
                            })
                                .sort((a, b) => b?.block_timestamp - a?.block_timestamp)[0];
                            if (matchingTransaction) {
                                const toAddress = await matchingTransaction?.to;
                                if (toAddress === link?.toAddress) {
                                    const fromAddress = await matchingTransaction?.from;
                                    status.hash = await matchingTransaction?.transaction_id;
                                    status.fromAddress = await fromAddress;
                                    status.recivedAmount =
                                        (await matchingTransaction?.value) / tron_helper_1.tronDecimal;
                                    status.status = payment_enum_1.PaymentStatus.PARTIALLY_SUCCESS;
                                    const updatedLink = await this.paymentLinkModel.findOneAndUpdate({ _id: link?._id }, { $set: status }, { new: true });
                                    if (updatedLink) {
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
            }
        }
        catch (error) {
            console.error("An error occurred:", error.message);
        }
    }
    async withdrawTronPaymentFromLinks() {
        try {
            this.logger.debug("--------------------- Cron Job Started for every 3 minute (To withdraw tron amount from payment links) -----------------------");
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
                throw new common_1.NotFoundException("Partial Payment links not found or not paid");
            }
            for (const link of partialPaymentLinks) {
                if (link?.recivedAmount >= link?.amount) {
                    let status = {
                        status: undefined,
                        withdrawStatus: undefined,
                        adminFee: undefined,
                        adminFeeWallet: undefined,
                        amountAfterTax: undefined,
                    };
                    const decryptedPrivateKey = await this.encryptionService.decryptData(link?.privateKey);
                    const totalAmount = await Number(link?.recivedAmount);
                    const decimals = await Number(link?.tokenDecimals);
                    let merchantAddress = "";
                    const isFiat = link?.transactionType === "FIAT";
                    merchantAddress = isFiat
                        ? config_service_1.ConfigService.keys.TRON_OWNER_ADDRESS
                        : await link?.tronWallet;
                    const tokenContractAddress = await link?.tokenAddress;
                    const paymentLinkAddress = await link?.toAddress;
                    const adminAddress = adminData[0]?.tronAdminWallet;
                    const adminCharges = adminData[0]?.tronPlatformFee;
                    const adminPvtKey = config_service_1.ConfigService.keys.TRON_ADMIN_PRIVATE_KEY;
                    const merchantAmount = Number(totalAmount / (1 + adminCharges / 100));
                    const adminAmount = Number(totalAmount - merchantAmount);
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
                            const updatedLink = await this.paymentLinkModel.findOneAndUpdate({ _id: link?._id }, { $set: status }, { new: true });
                            if (updatedLink && status.status === payment_enum_1.PaymentStatus.SUCCESS) {
                                await this.webhookService.sendWebhook(updatedLink.appId.toString(), updatedLink._id.toString(), webhook_log_schema_1.WebhookEvent.PAYMENT_SUCCESS, updatedLink.toObject());
                            }
                        }
                    }
                    else {
                        let transferNativeTransactionFee;
                        let transferTronToMerchant;
                        let transferTronToAdmin;
                        const nativeTransactionAmount = 12;
                        const halfNativeTransactionAmount = nativeTransactionAmount / 2;
                        const getBalanceWithRetry = async (address, retries = 5) => {
                            let balance = await (0, tron_helper_2.getTronBalance)(address);
                            for (let i = 0; i < retries && balance === null; i++) {
                                await new Promise((resolve) => setTimeout(resolve, 1000));
                                balance = await (0, tron_helper_2.getTronBalance)(address);
                            }
                            return balance;
                        };
                        let paymentLinkNativeBalance = await getBalanceWithRetry(paymentLinkAddress);
                        if (paymentLinkNativeBalance < nativeTransactionAmount) {
                            console.log("step 3");
                            transferNativeTransactionFee = await (0, tron_helper_1.transferTron)(adminPvtKey, constants_1.NATIVE, paymentLinkAddress, nativeTransactionAmount, decimals);
                            if (transferNativeTransactionFee.result) {
                                paymentLinkNativeBalance =
                                    await getBalanceWithRetry(paymentLinkAddress);
                            }
                        }
                        if (paymentLinkNativeBalance >= halfNativeTransactionAmount &&
                            status.withdrawStatus !== payment_enum_1.WithdrawPaymentStatus.NATIVE_TRANSFER) {
                            console.log("link", link);
                            const merchantReceiver = isFiat
                                ? config_service_1.ConfigService.keys.TRON_OWNER_ADDRESS
                                : merchantAddress;
                            console.log("merchantReceiver", isFiat);
                            transferTronToMerchant = await (0, tron_helper_1.transferTron)(decryptedPrivateKey, tokenContractAddress, merchantReceiver, Number(merchantAmount.toFixed(6)), decimals);
                            if (transferTronToMerchant.length === 64) {
                                paymentLinkNativeBalance =
                                    await getBalanceWithRetry(paymentLinkAddress);
                                status.withdrawStatus = payment_enum_1.WithdrawPaymentStatus.NATIVE_TRANSFER;
                            }
                        }
                        if (paymentLinkNativeBalance >= halfNativeTransactionAmount &&
                            status.withdrawStatus !== payment_enum_1.WithdrawPaymentStatus.ADMIN_CHARGES) {
                            transferTronToAdmin = await (0, tron_helper_1.transferTron)(decryptedPrivateKey, tokenContractAddress, adminAddress, Number(adminAmount.toFixed(6)), decimals);
                            if (transferTronToAdmin.length === 64) {
                                paymentLinkNativeBalance =
                                    await getBalanceWithRetry(paymentLinkAddress);
                                status.adminFee = adminAmount.toFixed(6);
                                status.adminFeeWallet = adminAddress;
                                status.withdrawStatus = payment_enum_1.WithdrawPaymentStatus.ADMIN_CHARGES;
                            }
                        }
                        if (transferTronToMerchant.length === 64 &&
                            transferTronToAdmin.length === 64) {
                            status.amountAfterTax = merchantAmount.toFixed(6);
                            status.withdrawStatus = payment_enum_1.WithdrawPaymentStatus.SUCCESS;
                            status.status = payment_enum_1.PaymentStatus.SUCCESS;
                            paymentLinkNativeBalance =
                                await getBalanceWithRetry(paymentLinkAddress);
                        }
                    }
                    const updatedLink = await this.paymentLinkModel.findOneAndUpdate({ _id: link?._id }, { $set: status }, { new: true });
                    if (updatedLink && status.status === payment_enum_1.PaymentStatus.SUCCESS) {
                        await this.webhookService.sendWebhook(updatedLink.appId.toString(), updatedLink._id.toString(), webhook_log_schema_1.WebhookEvent.PAYMENT_SUCCESS, updatedLink.toObject());
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
                .select("_id paymentLinkId walletAddress amount transactionType");
            let walletList = paymentLinks.map((item) => item.walletAddress);
            let walletTxList = [];
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
                    transactionType: element.payment.transactionType,
                };
                console.log(element, "element2");
                if (element.transactions && element.transactions.length > 0) {
                    element.transactions.forEach((transaction) => {
                        tx.block = transaction.blockNumber;
                        tx.gas = transaction.fee;
                        tx.hash = transaction.hash;
                        if (transaction.inputs && transaction.inputs.length > 0) {
                            tx.senderAddress = transaction.inputs[0].coin.address;
                        }
                        transaction.outputs.forEach((output) => {
                            if (output.address === tx.paymentLinkWalletAddress) {
                                const outputAmount = output.value / 10 ** 8;
                                if (Number(outputAmount) >= Number(tx.paymentLinkAmount)) {
                                    tx.txAmount = outputAmount;
                                    tx.status = true;
                                }
                            }
                        });
                    });
                }
                if (tx.status) {
                    finalOutput.push(tx);
                }
            });
            const bulkOperations = finalOutput.map((item) => ({
                updateOne: {
                    filter: { _id: item.id },
                    update: {
                        $set: {
                            streamId: item.streamId || config_service_1.ConfigService.keys.WEB_STREAMER_ID,
                        },
                    },
                },
            }));
            await this.monitorModel.bulkWrite(bulkOperations);
            for (const item of finalOutput) {
                console.log(item, "item2");
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
            }
            this.logger.debug(`------------ Cron Job Started 1 MINUTE (To process btc payment) -------------- ${finalOutput.length}`);
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
                console.log("VISHAL just abhi maine change kiya hai address dekh len bhia ---------------> ", receiverAddress);
                const privateKey = this.encryptionService.decryptData(wallet?.privateKey);
                try {
                    console.log("🚀 BTC Transfer Started");
                    console.log("Sender Wallet: ", senderWalletAddress);
                    console.log("Receiver Wallet: ", receiverAddress);
                    console.log("Full Amount: ", fullAmount);
                    console.log("PrivateKey (decrypted): ", privateKey);
                    console.log("is Fiat", isFiat);
                    console.log("BTC_OWNER_ADDRES", config_service_1.ConfigService.keys.BTC_OWNER_ADDRESS);
                    const tx = await (0, bitcoin_helper_1.btcTransferFromPaymentLinks)(privateKey, senderWalletAddress, receiverAddress, fullAmount, isFiat, config_service_1.ConfigService.keys.BTC_OWNER_ADDRESS);
                    if (tx.txId) {
                        await this.updatePaymentLinkModel(wallet?._id, {
                            withdrawStatus: payment_enum_1.WithdrawPaymentStatus.SUCCESS,
                            status: payment_enum_1.PaymentStatus.SUCCESS,
                        });
                    }
                }
                catch (error) {
                    console.log("Error in evm native transafer from payment link 999: ", error.message);
                }
            }
            return partialSuccessWalletId;
        }
        catch (error) {
            console.log("An error occurred in withdrawPaymentFromLinksAndUpdateStatus : ", error);
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
                const tronWalletDataList = await Promise.all(getAllAppsTronWallets
                    .filter((wallet) => {
                    return wallet?.TronWalletMnemonic?.address;
                })
                    .map(async (wallet) => {
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
                                        symbol: "TRX",
                                        txType: txTypeOfPayment,
                                    };
                                    await this.merchantTxModel.create(newTxData);
                                }
                            }
                        }
                        return null;
                    }
                    catch (error) {
                        console.error(`Error fetching Tron Wallet Data for Merchant ${merchantId}:`, error.message);
                        return null;
                    }
                }));
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
                if (config_service_1.ConfigService.keys.TATUM_NETWORK === "bitcoin") {
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
                    "x-api-key": "t-670619093810b72fabd57238-8dc526a6df544ed98b60e4cf",
                };
                const response = await axios_1.default.post(url, payload, {
                    headers: constants_1.postHeaders,
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
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionService.prototype, "withdrawPaymentFromLinksAndUpdateStatus", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionService.prototype, "tronPaymentLink", null);
__decorate([
    (0, schedule_1.Cron)("0 */3 * * * *"),
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