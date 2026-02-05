export declare const NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export declare const paymentLink_And_App_projectData: {
    _id: number;
    toAddress: number;
    tokenAddress: number;
    recivedAmount: number;
    tokenDecimals: number;
    chainId: number;
    privateKey: number;
    withdrawStatus: number;
    transactionType: number;
    "appDetail._id": number;
    "appDetail.EVMWalletMnemonic": number;
};
export declare const paymentLink_And_App_lookupData: {
    from: string;
    localField: string;
    foreignField: string;
    as: string;
};
export declare const btc_PaymentLink_And_App_projectData: {
    _id: number;
    toAddress: number;
    tokenAddress: number;
    recivedAmount: number;
    tokenDecimals: number;
    chainId: number;
    privateKey: number;
    withdrawStatus: number;
    transactionType: number;
    "appDetail._id": number;
    "appDetail.BtcWalletMnemonic": number;
};
export declare const postHeaders: {
    accept: string;
    "content-type": string;
    "x-api-key": string;
};
export declare const cgHeaders: {
    accept: string;
    "x-cg-pro-api-key": string;
};
export declare const ESTIMATE_GAS_URL = "https://api.tatum.io/v3/blockchain/estimate";
export declare const SEND_BTC_URL = "https://api.tatum.io/v3/bitcoin/transaction";
export declare const GET_BALANCE_URL = "https://api.tatum.io/v3/bitcoin/address/balance/";
export declare const GET_BTC_TX_BATCH_URL = "https://api.tatum.io/v3/bitcoin/transaction/address/batch";
export declare const minFee = 0;
export declare const maxFee = 50;
export declare const BNB_CHAIN_ID = "97";
export declare const ETH_CHAIN_ID = "11155111";
export declare const POLYGON_CHAIN_ID = "80002";
export declare const BTC_CHAIN_ID = "BTC";
export declare const TRON_CHAIN_ID = "TRON";
export declare enum EVMChains {
    BNB = "97",
    ETH = "11155111",
    POLYGON = "80002"
}
export declare const EVM_CHAIN_ID_LIST: string[];
export declare const AMOUNT_TO_APPROVE: bigint;
export declare enum TIME_PERIOD {
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY",
    ANNUALLY = "ANNUALLY"
}
