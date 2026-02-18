export declare class AddTransactionDto {
    appsId: any;
    amount: string;
    toAddress: string;
    fromAddress: string;
    note: string;
    gas: string;
    gasPrice: string;
    hash: string;
    blockNumber: string;
    symbol: string;
    chainId: string;
    file: string;
    invoice: string;
    adminFee: string;
    adminFeeWallet: string;
    adminFeeTxHash: string;
}
export declare class CryptoTransaction {
    appsId: string;
    tokenId: string;
    amount: string;
    withdrawalAddress: string;
    isWithTax: boolean;
    swapTokenAddress: string;
    note?: string;
}
export declare class WithdrawFiat {
    appsId: any;
    totalFiatBalance: number;
    minimumWithdrawl: number;
    withdrawlAmount: number;
    currency: string;
    cryptoValue: number;
    walletAddress: string;
    note?: string;
}
export declare class adminFiatTransferDto {
    fiatWithdrawId: string;
    txHash: string;
}
