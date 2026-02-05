export declare const betweenRandomNumber: (min: any, max: any) => number;
export declare function fromWeiCustom(balance: any, decimals: any): string;
export declare function toWeiCustom(amount: any, decimals: any): any;
export declare function getCoingeckoSymbol(normalSymbol: any): any;
export declare function getCoingeckoPrice(currency: any): Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare function sumBalances(data: any): {};
export declare function isValidWalletAddress(address: string, chianId: string): boolean;
export declare const generateInvoiceNumber: () => string;
export declare const formatNumber: (input: any, decimalPlace: any) => any;
export declare const trimAddress: (address: any, firstChar: any, lastChar: any) => string;
export declare const formatDate: (dateString: any) => string;
export declare function txExplorer(chainId: any, txHash: any): Promise<{
    explorerURL: string;
}>;
export declare function calculateTaxes(fullAmount: any, adminPaymentLinksCharges: any): Promise<{
    merchantAmount: number;
    adminAmount: number;
}>;
