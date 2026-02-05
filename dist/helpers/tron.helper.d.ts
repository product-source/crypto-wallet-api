export declare const tronDecimal: number;
export declare const getTronNativeBalance: (addresses: string[]) => Promise<number>;
export declare const generateTronWallet: (mnemonic: any, index: number) => {
    address: string | false;
    privateKey: string;
    mnemonic: any;
    path: string;
    index: number;
};
export declare const getTronBalance: (address: any) => Promise<number>;
export declare const getTRC20Balance: (tokens: any[], privateKey: string) => Promise<any[]>;
export declare function hexToTronAddress(hexString: any): string;
export declare const getTronTransactions: (address: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare const estimateTrxForTrc20Transfer: (fromAddress: any, toAddress: any, amount: any) => Promise<number>;
export declare const getTRC20Transactions: (address: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare const transferTron: (privateKey: string, tokenContractAddress: string, receiverAddress: string, amount: number, decimal: number) => Promise<string | import("tronweb/lib/esm/types").BroadcastReturn<import("tronweb/lib/esm/types").SignedTransaction<import("tronweb/lib/esm/types").ContractParamter> & import("tronweb/lib/esm/types").Transaction<import("tronweb/lib/esm/types").TransferContract>>>;
export declare const isValidTronAddress: (address: string) => boolean;
export declare const merchantTronFundWithdraw: (privateKey: string, tokenContractAddress: string, amount: string, receiverAddress: string, decimal: number) => Promise<{
    status: boolean;
    error: string;
    data: any;
} | {
    error: any;
    status: boolean;
    data: {
        transactionHash: string;
        gasUsed: number;
        effectiveGasPrice: number;
        blockNumber: number;
    };
}>;
export declare const getTronToAddressAllTransactions: (address: any) => Promise<any>;
export declare const getTronTokenBalance: (address: any, tokenAddress: any, privateKey: any) => Promise<{
    ethBalanceEther: any;
    tokenBalanceEther: any;
}>;
