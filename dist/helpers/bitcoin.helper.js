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
const BTC_DUST_LIMIT_SATS = 546;
const BTC_DUST_LIMIT = BTC_DUST_LIMIT_SATS / 1e8;
async function btcTransferFromPaymentLinks(walletPrivateKey, fromAddress, merchantToAddress, fullAmount, isFiat = false, ownerAddress = null, adminFeePercent = 0, adminWalletAddress = null) {
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
        adminFeePercent,
        adminWalletAddress,
    });
    const actualReceiver = isFiat ? ownerAddress : merchantToAddress;
    if (!actualReceiver) {
        throw new Error("Receiver address is missing");
    }
    const changeWallet = fromAddress;
    console.log("➡️ actualReceiver:", actualReceiver);
    console.log("➡️ changeWallet:", changeWallet);
    const fullAmountNum = Number(Number(fullAmount).toFixed(8));
    let adminFeeAmount = 0;
    let merchantAmount = fullAmountNum;
    let canSendAdminFee = false;
    if (adminFeePercent > 0 && adminWalletAddress) {
        adminFeeAmount = Number((fullAmountNum * (adminFeePercent / 100)).toFixed(8));
        merchantAmount = Number((fullAmountNum - adminFeeAmount).toFixed(8));
        if (adminFeeAmount >= BTC_DUST_LIMIT) {
            canSendAdminFee = true;
            console.log(`✅ Admin fee ${adminFeeAmount} BTC is above dust limit (${BTC_DUST_LIMIT} BTC), will split.`);
        }
        else {
            console.log(`⚠️ Admin fee ${adminFeeAmount} BTC is below dust limit (${BTC_DUST_LIMIT} BTC). Skipping admin fee output.`);
            merchantAmount = fullAmountNum;
            adminFeeAmount = 0;
        }
    }
    const estimateOutputs = [
        { address: actualReceiver, value: merchantAmount },
    ];
    if (canSendAdminFee) {
        estimateOutputs.push({ address: adminWalletAddress, value: adminFeeAmount });
    }
    const estimateGasPayload = {
        chain: "BTC",
        type: "TRANSFER",
        fromAddress: [fromAddress],
        to: estimateOutputs,
    };
    let txGas;
    const MAX_GAS_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_GAS_RETRIES; attempt++) {
        try {
            const gasResponse = await axios_1.default.post(constants_1.ESTIMATE_GAS_URL, estimateGasPayload, {
                headers: constants_1.postHeaders,
            });
            const output = gasResponse.data;
            if (output.slow) {
                txGas = output;
                break;
            }
            else {
                throw output;
            }
        }
        catch (err) {
            console.error(`[BTC Gas] Attempt ${attempt}/${MAX_GAS_RETRIES} fee estimation failed:`, err?.data || err?.message || err);
            if (attempt === MAX_GAS_RETRIES) {
                return { error: "BTC fee estimation failed after retries", ...err?.data };
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }
    try {
        const networkFee = Number(txGas["medium"]);
        const merchantAmountAfterGas = Number((merchantAmount - networkFee).toFixed(8));
        if (merchantAmountAfterGas <= 0) {
            console.log("❌ Amount after gas is zero or negative. Cannot send BTC.");
            return { error: "Amount too small after deducting network fee" };
        }
        const toOutputs = [
            { address: actualReceiver, value: merchantAmountAfterGas },
        ];
        if (canSendAdminFee) {
            toOutputs.push({ address: adminWalletAddress, value: adminFeeAmount });
        }
        const sendBtcPayload = {
            fromAddress: [
                {
                    address: fromAddress,
                    privateKey: walletPrivateKey,
                },
            ],
            to: toOutputs,
            fee: txGas["medium"],
            changeAddress: changeWallet,
        };
        console.log("➡️ Sending BTC with payload:", JSON.stringify(sendBtcPayload));
        console.log(`💰 Merchant: ${merchantAmountAfterGas} BTC → ${actualReceiver}`);
        if (canSendAdminFee) {
            console.log(`💰 Admin fee: ${adminFeeAmount} BTC → ${adminWalletAddress}`);
        }
        const sendBtcResponse = await axios_1.default.post(constants_1.SEND_BTC_URL, sendBtcPayload, {
            headers: constants_1.postHeaders,
        });
        return {
            ...sendBtcResponse.data,
            adminFeeSent: canSendAdminFee,
            adminFeeAmount: canSendAdminFee ? adminFeeAmount : 0,
            merchantAmount: merchantAmountAfterGas,
        };
    }
    catch (error) {
        console.log("Error in BTC transfer from paymentLink : ", error?.response?.data || error.message);
        return error?.response?.data || { error: error.message };
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
        if (!receipt?.txId) {
            console.error("[BTC Withdraw] ❌ No txId in response:", receipt);
            return {
                error: "BTC transaction submitted but no txId returned",
                status: false,
                data: null,
            };
        }
        console.log(`[BTC Withdraw] ✅ TX sent: ${receipt.txId}`);
        return {
            error: null,
            status: true,
            data: {
                transactionHash: receipt.txId,
                gasUsed: 0,
                effectiveGasPrice: 0,
                blockNumber: 0,
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