"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBitcoinBalance = exports.transferBitcoin = exports.generateBitcoinWallet = void 0;
exports.btcTransferFromPaymentLinks = btcTransferFromPaymentLinks;
exports.getBTCNativeBalance = getBTCNativeBalance;
exports.merchantBtcFundWithdraw = merchantBtcFundWithdraw;
const bitcoin = __importStar(require("bitcoinjs-lib"));
const bip39 = __importStar(require("bip39"));
const bip32_1 = __importDefault(require("bip32"));
const ecc = __importStar(require("tiny-secp256k1"));
const axios_1 = __importDefault(require("axios"));
const config_service_1 = require("../config/config.service");
const constants_1 = require("../constants");
const generateBitcoinWallet = (mnemonic, index) => {
    let btcNetwork = bitcoin.networks.testnet;
    const bip32 = (0, bip32_1.default)(ecc);
    const network = config_service_1.ConfigService.keys.TATUM_NETWORK;
    if (network !== "bitcoin-testnet") {
        btcNetwork = bitcoin.networks.bitcoin;
    }
    const path = `m/84'/0'/0'/0/${index}`;
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    let root = bip32?.fromSeed(seed, btcNetwork);
    let account = root.derivePath(path);
    let node = account.derive(0).derive(0);
    let btcAddress = bitcoin.payments.p2wpkh({
        pubkey: node.publicKey,
        network: btcNetwork,
    }).address;
    const wallet = {
        address: btcAddress,
        privateKey: node.toWIF(),
        mnemonic: mnemonic,
        path: path,
        index: index,
    };
    return wallet;
};
exports.generateBitcoinWallet = generateBitcoinWallet;
async function btcTransferFromPaymentLinks(walletPrivateKey, fromAddress, merchantToAddress, fullAmount, isFiat = false, ownerAddress = null) {
    isFiat = ["true", "1", "yes"].includes(String(isFiat).toLowerCase());
    if (isFiat && !ownerAddress) {
        throw new Error("FIAT transfer requires ownerAddress");
    }
    console.log("⚡ BTC Helper Called With:");
    console.log({
        walletPrivateKey,
        fromAddress,
        merchantToAddress,
        fullAmount,
        isFiat,
        ownerAddress,
    });
    const actualReceiver = isFiat ? ownerAddress : merchantToAddress;
    if (!actualReceiver) {
        throw new Error("Receiver address is missing");
    }
    const changeWallet = fromAddress;
    console.log("➡️ actualReceiver:", actualReceiver);
    console.log("➡️ changeWallet:", changeWallet);
    const fullAmountInSatoshi = Number(fullAmount).toFixed(8);
    const estimateGasPayload = {
        chain: "BTC",
        type: "TRANSFER",
        fromAddress: [fromAddress],
        to: [
            {
                address: actualReceiver,
                value: Number(fullAmountInSatoshi),
            },
        ],
    };
    let txGas;
    try {
        const gasResponse = await axios_1.default.post(constants_1.ESTIMATE_GAS_URL, estimateGasPayload, {
            headers: constants_1.postHeaders,
        });
        const output = gasResponse.data;
        if (output.slow) {
            txGas = output;
        }
        else {
            throw output;
        }
    }
    catch (err) {
        return err.data;
    }
    try {
        const amountAfterTax = Number(fullAmountInSatoshi) - Number(txGas["medium"]);
        const sendBtcPayload = {
            fromAddress: [
                {
                    address: fromAddress,
                    privateKey: walletPrivateKey,
                },
            ],
            to: [
                {
                    address: actualReceiver,
                    value: Number(amountAfterTax.toFixed(8)),
                },
            ],
            fee: txGas["medium"],
            changeAddress: changeWallet,
        };
        console.log("➡️ Sending BTC with payload:", sendBtcPayload);
        const sendBtcResponse = await axios_1.default.post(constants_1.SEND_BTC_URL, sendBtcPayload, {
            headers: constants_1.postHeaders,
        });
        return sendBtcResponse.data;
    }
    catch (error) {
        console.log("Error in Transaction Native token from paymentLink : ", error.response.data);
        return error.response.data;
    }
}
const transferBitcoin = async (senderPrivateKey, senderAddress, receiverAddress, amount) => {
    try {
        console.log("R--------------------------------------------");
        const network = config_service_1.ConfigService.keys.TATUM_NETWORK;
        const baseURL = "https://api.tatum.io";
        const getUtxoUrl = `${baseURL}/v3/data/utxos?chain=${network}&address=${senderAddress}&totalValue=${amount}`;
        const sentBtcUrl = `${baseURL}/v3/bitcoin/transaction`;
        const headers = {
            accept: "application/json",
            "x-api-key": config_service_1.ConfigService.keys.TATUM_X_API_KEY,
        };
        const utxoResponse = await axios_1.default.get(getUtxoUrl, { headers });
        const fromUTXO = await utxoResponse?.data?.map((item) => ({
            txHash: item.txHash,
            index: item.index,
            privateKey: senderPrivateKey,
        }));
        if (fromUTXO.length === 0) {
            return {
                status: false,
                error: "Insufficient UTXo for this transactions",
            };
        }
        const payload = {
            fromUTXO: fromUTXO,
            to: [{ address: receiverAddress, value: amount }],
        };
        const txResponse = await axios_1.default.post(sentBtcUrl, payload, {
            headers: {
                ...headers,
                "content-type": "application/json",
            },
        });
        return { status: true, txId: txResponse.data };
    }
    catch (error) {
        console.error("Error in transferBitcoin:", error?.response?.data?.cause);
        return {
            status: false,
            error: error?.response?.data?.cause
                ? error?.response?.data?.cause
                : error.message,
        };
    }
};
exports.transferBitcoin = transferBitcoin;
const getBitcoinBalance = async (walletAddress) => {
    try {
        const baseURL = "https://api.tatum.io";
        const checkBalanceURL = `${baseURL}/v3/bitcoin/address/balance/${walletAddress}`;
        const headers = {
            accept: "application/json",
            "x-api-key": config_service_1.ConfigService.keys.TATUM_X_API_KEY,
        };
        const balance = await axios_1.default.get(checkBalanceURL, { headers });
        return { data: balance.data };
    }
    catch (error) {
        console.error("Error in transferBitcoin:", error.response ? error.response.data : error.message);
        return {
            status: false,
            error: error.response ? error.response.data : error.message,
        };
    }
};
exports.getBitcoinBalance = getBitcoinBalance;
async function getBTCNativeBalance(walletAddresses) {
    let btc = 0;
    try {
        const baseURL = "https://api.tatum.io";
        const headers = {
            accept: "application/json",
            "x-api-key": config_service_1.ConfigService.keys.TATUM_X_API_KEY,
        };
        if (walletAddresses.length > 0) {
            for (const address of walletAddresses) {
                const checkBalanceURL = `${baseURL}/v3/bitcoin/address/balance/${address}`;
                const response = await axios_1.default.get(checkBalanceURL, { headers });
                const balance = response.data;
                btc +=
                    parseFloat(balance?.incoming || 0) -
                        parseFloat(balance?.outgoing || 0);
            }
        }
    }
    catch (error) {
        console.error("Error in getBTCNativeBalance:", error.message);
    }
    finally {
        return btc;
    }
}
async function merchantBtcFundWithdraw(privateKey, withdrawalAmount, withdrawalAddress, fromAddress, adminCharges, adminWalletAddress) {
    try {
        const payloadEstimateGas = {
            chain: "BTC",
            type: "TRANSFER",
            fromAddress: [fromAddress],
            to: [
                {
                    address: withdrawalAddress,
                    value: withdrawalAmount,
                },
            ],
        };
        const gasResponse = await axios_1.default.post(constants_1.ESTIMATE_GAS_URL, payloadEstimateGas, {
            headers: constants_1.postHeaders,
        });
        const txFee = gasResponse.data;
        if (!txFee || !txFee.medium) {
            throw new Error("Failed to estimate transaction fees.");
        }
        const to = [
            {
                address: withdrawalAddress,
                value: withdrawalAmount,
            },
            ...(adminCharges > 0
                ? [
                    {
                        address: adminWalletAddress,
                        value: adminCharges,
                    },
                ]
                : []),
        ];
        const payloadToSend = {
            fromAddress: [
                {
                    address: fromAddress,
                    privateKey: privateKey,
                },
            ],
            to: to,
            fee: txFee.medium,
            changeAddress: fromAddress,
        };
        const sendResponse = await axios_1.default.post(constants_1.SEND_BTC_URL, payloadToSend, {
            headers: constants_1.postHeaders,
        });
        const receipt = sendResponse.data;
        return {
            error: null,
            status: true,
            data: {
                transactionHash: receipt.txId,
                gasUsed: 25255,
                effectiveGasPrice: 9898,
                blockNumber: 58,
            },
        };
    }
    catch (error) {
        return {
            error: error.response?.data?.cause || error.response?.data?.message,
            status: false,
            data: null,
        };
    }
}
//# sourceMappingURL=bitcoin.helper.js.map