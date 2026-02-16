"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIME_PERIOD = exports.AMOUNT_TO_APPROVE = exports.EVM_CHAIN_ID_LIST = exports.EVMChains = exports.TRON_CHAIN_ID = exports.BTC_CHAIN_ID = exports.POLYGON_CHAIN_ID = exports.ETH_CHAIN_ID = exports.BNB_CHAIN_ID = exports.maxFee = exports.minFee = exports.GET_BTC_TX_BATCH_URL = exports.GET_BALANCE_URL = exports.SEND_BTC_URL = exports.ESTIMATE_GAS_URL = exports.cgHeaders = exports.postHeaders = exports.btc_PaymentLink_And_App_projectData = exports.paymentLink_And_App_lookupData = exports.paymentLink_And_App_projectData = exports.NATIVE = void 0;
const config_service_1 = require("../config/config.service");
exports.NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
exports.paymentLink_And_App_projectData = {
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
exports.paymentLink_And_App_lookupData = {
    from: "apps",
    localField: "appId",
    foreignField: "_id",
    as: "appDetail",
};
exports.btc_PaymentLink_And_App_projectData = {
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
    "appDetail.BtcWalletMnemonic": 1,
};
exports.postHeaders = {
    accept: "application/json",
    "content-type": "application/json",
    "x-api-key": config_service_1.ConfigService.keys.TATUM_X_API_KEY,
};
exports.cgHeaders = {
    accept: "application/json",
    "x-cg-pro-api-key": config_service_1.ConfigService.keys.COINGECKO_PRO_API_KEY,
};
exports.ESTIMATE_GAS_URL = "https://api.tatum.io/v3/blockchain/estimate";
exports.SEND_BTC_URL = "https://api.tatum.io/v3/bitcoin/transaction";
exports.GET_BALANCE_URL = `https://api.tatum.io/v3/bitcoin/address/balance/`;
exports.GET_BTC_TX_BATCH_URL = "https://api.tatum.io/v3/bitcoin/transaction/address/batch";
exports.minFee = 0;
exports.maxFee = 50;
exports.BNB_CHAIN_ID = config_service_1.ConfigService.keys.BNB_CHAIN_ID || "97";
exports.ETH_CHAIN_ID = config_service_1.ConfigService.keys.ETH_CHAIN_ID || "11155111";
exports.POLYGON_CHAIN_ID = config_service_1.ConfigService.keys.POLYGON_CHAIN_ID || "80002";
exports.BTC_CHAIN_ID = "BTC";
exports.TRON_CHAIN_ID = "TRON";
exports.EVMChains = {
    BNB: exports.BNB_CHAIN_ID,
    ETH: exports.ETH_CHAIN_ID,
    POLYGON: exports.POLYGON_CHAIN_ID,
};
exports.EVM_CHAIN_ID_LIST = [exports.BNB_CHAIN_ID, exports.ETH_CHAIN_ID, exports.POLYGON_CHAIN_ID];
exports.AMOUNT_TO_APPROVE = BigInt("1000000000000000000000000000000000000000");
var TIME_PERIOD;
(function (TIME_PERIOD) {
    TIME_PERIOD["MONTHLY"] = "MONTHLY";
    TIME_PERIOD["QUARTERLY"] = "QUARTERLY";
    TIME_PERIOD["ANNUALLY"] = "ANNUALLY";
})(TIME_PERIOD || (exports.TIME_PERIOD = TIME_PERIOD = {}));
//# sourceMappingURL=index.js.map