import { ConfigService } from "src/config/config.service";

export const NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const paymentLink_And_App_projectData = {
  _id: 1,
  toAddress: 1,
  tokenAddress: 1,
  recivedAmount: 1,
  tokenDecimals: 1,
  chainId: 1,
  privateKey: 1,
  withdrawStatus: 1,
  transactionType: 1,
  "appDetail._id": 1,
  "appDetail.EVMWalletMnemonic": 1,
};

export const paymentLink_And_App_lookupData = {
  from: "apps",
  localField: "appId",
  foreignField: "_id",
  as: "appDetail",
};

export const btc_PaymentLink_And_App_projectData = {
  _id: 1,
  toAddress: 1,
  tokenAddress: 1,
  recivedAmount: 1,
  tokenDecimals: 1,
  chainId: 1,
  privateKey: 1,
  withdrawStatus: 1,
  transactionType: 1,      // <-- ADD THIS
  "appDetail._id": 1,
  "appDetail.BtcWalletMnemonic": 1,
};

export const postHeaders = {
  accept: "application/json",
  "content-type": "application/json",
  "x-api-key": ConfigService.keys.TATUM_X_API_KEY,
};

export const cgHeaders = {
  accept: "application/json",
  "x-cg-pro-api-key": ConfigService.keys.COINGECKO_PRO_API_KEY,
};

export const ESTIMATE_GAS_URL = "https://api.tatum.io/v3/blockchain/estimate";
export const SEND_BTC_URL = "https://api.tatum.io/v3/bitcoin/transaction";
export const GET_BALANCE_URL = `https://api.tatum.io/v3/bitcoin/address/balance/`;
export const GET_BTC_TX_BATCH_URL =
  "https://api.tatum.io/v3/bitcoin/transaction/address/batch";

export const minFee = 0;
export const maxFee = 50;

export const BNB_CHAIN_ID = "97";
export const ETH_CHAIN_ID = "11155111";
export const POLYGON_CHAIN_ID = "80002";
export const BTC_CHAIN_ID = "BTC";
export const TRON_CHAIN_ID = "TRON";

export enum EVMChains {
  BNB = BNB_CHAIN_ID,
  ETH = ETH_CHAIN_ID,
  POLYGON = POLYGON_CHAIN_ID,
}

export const EVM_CHAIN_ID_LIST = [BNB_CHAIN_ID, ETH_CHAIN_ID, POLYGON_CHAIN_ID];

export const AMOUNT_TO_APPROVE = BigInt(
  "1000000000000000000000000000000000000000"
);

export enum TIME_PERIOD {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  ANNUALLY = "ANNUALLY",
}
