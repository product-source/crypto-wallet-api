import { TransactionService } from "./moralis-tx.service";
export declare class MoralisTxController {
    private readonly moralisTxService;
    constructor(moralisTxService: TransactionService);
    stream(tx: any): Promise<any>;
    getTxList(query: any): Promise<{
        total: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        data: (import("mongoose").Document<unknown, {}, import("./schema/moralis-tx.schema").Transaction, {}, {}> & import("./schema/moralis-tx.schema").Transaction & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    getWithdrawTronPaymentFromLinks(query: any): Promise<void>;
    checkBitcoinPaymentLinks(query: any): Promise<any[]>;
    getWithdrawBTCPaymentFromLinksAndUpdateStatus(): Promise<any>;
    getTronBalance(query: any): Promise<number | any[]>;
    transferTRON(query: any): Promise<{
        message: string;
        transactions: {
            adminTxId: any;
            adminTronAmount: number;
            UserTxId: any;
            adminAddress: string;
            userTronAmount: number;
        };
    }>;
}
