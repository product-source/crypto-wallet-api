export declare const generateBitcoinWallet: (mnemonic: any, index: number) => {
    address: string;
    privateKey: string;
    mnemonic: any;
    path: string;
    index: number;
};
export declare function btcTransferFromPaymentLinks(walletPrivateKey: any, fromAddress: any, merchantToAddress: any, fullAmount: any, isFiat?: boolean, ownerAddress?: any): Promise<any>;
export declare const transferBitcoin: any;
export declare const getBitcoinBalance: any;
export declare function getBTCNativeBalance(walletAddresses: any): Promise<number>;
export declare function merchantBtcFundWithdraw(privateKey: any, withdrawalAmount: any, withdrawalAddress: any, fromAddress: any, adminCharges: any, adminWalletAddress: any): Promise<{
    error: any;
    status: boolean;
    data: {
        transactionHash: any;
        gasUsed: number;
        effectiveGasPrice: number;
        blockNumber: number;
    };
} | {
    error: any;
    status: boolean;
    data: any;
}>;
