import { Transaction } from "./schema/moralis-tx.schema";
import { Model } from "mongoose";
import { WalletMonitorDocument } from "src/wallet-monitor/schema/wallet-monitor.schema";
import { PaymentLinkDocument } from "src/payment-link/schema/payment-link.schema";
import { AppsDocument } from "src/apps/schema/apps.schema";
import { MerchantAppTxDocument } from "src/merchant-app-tx/schema/merchant-app-tx.schema";
import { EncryptionService } from "src/utils/encryption.service";
import { AdminService } from "src/admin/admin.service";
import { TokenDocument } from "src/token/schema/token.schema";
import { AdminDocument } from "src/admin/schema/admin.schema";
import { WebhookService } from "src/webhook/webhook.service";
export declare class TransactionService {
    private readonly transactionModel;
    private readonly monitorModel;
    private readonly paymentLinkModel;
    private readonly appModel;
    private readonly tokenModel;
    private readonly adminModel;
    private readonly merchantTxModel;
    private readonly adminService;
    private encryptionService;
    private readonly webhookService;
    constructor(transactionModel: Model<Transaction>, monitorModel: Model<WalletMonitorDocument>, paymentLinkModel: Model<PaymentLinkDocument>, appModel: Model<AppsDocument>, tokenModel: Model<TokenDocument>, adminModel: Model<AdminDocument>, merchantTxModel: Model<MerchantAppTxDocument>, adminService: AdminService, encryptionService: EncryptionService, webhookService: WebhookService);
    private readonly logger;
    stream(tx: any): Promise<any>;
    deletePaymentLinksWhichIsNotExistAnymore(): Promise<any>;
    deleteAppsWhichIsNotExistAnymore(): Promise<any>;
    withdrawPaymentFromLinksAndUpdateStatus(): Promise<any>;
    checkWalletTx(walletAddress: string, contractAddress: string, chainId: string, txAmount: string): Promise<any>;
    getTransactions(query: any): Promise<{
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, Transaction, {}, {}> & Transaction & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    updatePaymentLinkModel(id: any, updateFields: any): Promise<boolean>;
    tronPaymentLink(): Promise<void>;
    withdrawTronPaymentFromLinks(): Promise<void>;
    getTronBalanceAPI(query: any): Promise<number | any[]>;
    transferTRONAPI(query: any): Promise<{
        message: string;
        transactions: {
            adminTxId: any;
            adminTronAmount: number;
            UserTxId: any;
            adminAddress: string;
            userTronAmount: number;
        };
    }>;
    processBitcoinPaymentLinks(): Promise<any[]>;
    withdrawBTCPaymentFromLinksAndUpdateStatus(): Promise<any>;
    TRON_DIRECT_DEPOSIT_MONITOR(): Promise<any[]>;
    BITCOIN_DIRECT_DEPOSIT_MONITOR(): Promise<any[]>;
}
