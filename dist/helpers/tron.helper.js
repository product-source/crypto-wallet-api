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
exports.getTronTokenBalance = exports.getTronToAddressAllTransactions = exports.merchantTronFundWithdraw = exports.isValidTronAddress = exports.estimateAndFundTrc20Gas = exports.verifyTronTransaction = exports.transferTron = exports.getTRC20Transactions = exports.estimateTrxForTrc20Transfer = exports.getTronTransactions = exports.getTRC20Balance = exports.getTronBalance = exports.generateTronWallet = exports.getTronNativeBalance = exports.tronDecimal = void 0;
exports.hexToTronAddress = hexToTronAddress;
const bip32_1 = __importDefault(require("bip32"));
const tronweb_1 = require("tronweb");
const ecc = __importStar(require("tiny-secp256k1"));
const bip39 = __importStar(require("bip39"));
const bs58_1 = __importDefault(require("bs58"));
const crypto = __importStar(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("../constants");
const config_service_1 = require("../config/config.service");
const helper_1 = require("./helper");
exports.tronDecimal = 10 ** 6;
const fullHost = config_service_1.ConfigService.keys.TRON_NODE || "https://api.shasta.trongrid.io";
const tronHeaders = { "TRON-PRO-API-KEY": config_service_1.ConfigService.keys.TRON_GRID_API_KEY || "8d831a3d-aba9-40b7-9e4b-c5ba2a6b77da" };
const tronWeb = new tronweb_1.TronWeb({
    fullHost: fullHost,
    headers: tronHeaders,
});
const getTronNativeBalance = async (addresses) => {
    try {
        const tronBalance = await Promise.all(addresses.map(async (address) => {
            const balance = await tronWeb.trx.getBalance(address);
            return balance / 10 ** 6;
        })).then((balances) => balances.reduce((total, currentBalance) => total + currentBalance, 0));
        return tronBalance ? Number(tronBalance) : 0;
    }
    catch (error) {
        console.log("Error in get tron balance : ", error.message);
        return 0;
    }
};
exports.getTronNativeBalance = getTronNativeBalance;
const generateTronWallet = (mnemonic, index) => {
    const bip32 = (0, bip32_1.default)(ecc);
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const node = bip32.fromSeed(seed);
    const path = `m/44'/195'/0'/0/${index}`;
    const child = node.derivePath(path);
    const privateKey = child?.privateKey?.toString("hex");
    const address = tronweb_1.TronWeb.address.fromPrivateKey(privateKey);
    const wallet = {
        address: address,
        privateKey: privateKey,
        mnemonic: mnemonic,
        path: path,
        index: index,
    };
    return wallet;
};
exports.generateTronWallet = generateTronWallet;
const getTronBalance = async (address) => {
    const balance = await tronWeb.trx.getBalance(address);
    return balance / 10 ** 6;
};
exports.getTronBalance = getTronBalance;
const getTRC20Balance = async (tokens, privateKey) => {
    console.log("get TRC20 Balance called ----------------");
    try {
        const tronWeb = new tronweb_1.TronWeb({
            fullHost: fullHost,
            headers: tronHeaders,
            privateKey: privateKey,
        });
        const userAddress = tronweb_1.TronWeb.address.fromPrivateKey(privateKey);
        let updatedTokens = [];
        for (const token of tokens) {
            const tokenAddress = token.address || token.tokenAddress;
            const contract = await tronWeb.contract().at(tokenAddress);
            const balance = Number(await contract.balanceOf(userAddress).call());
            const decimal = Number(await contract.decimals().call());
            updatedTokens.push({
                ...token?._doc,
                token_address: tokenAddress,
                balance: (0, helper_1.fromWeiCustom)(balance, decimal),
                decimal: decimal,
            });
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return updatedTokens;
    }
    catch (error) {
        console.error("Error fetching token details:", error);
        return [];
    }
};
exports.getTRC20Balance = getTRC20Balance;
function hexToTronAddress(hexString) {
    if (hexString.startsWith("0x") || hexString.startsWith("0X")) {
        hexString = hexString.subarray(2);
    }
    const tronHexString = "41" + hexString;
    const bytes = Buffer.from(tronHexString, "hex");
    const hash1 = crypto.createHash("sha256").update(bytes).digest();
    const hash2 = crypto.createHash("sha256").update(hash1).digest();
    const checksum = hash2.subarray(0, 4);
    const addressWithChecksum = Buffer.concat([bytes, checksum]);
    const tronAddress = bs58_1.default.encode(addressWithChecksum);
    return tronAddress;
}
const getTronTransactions = async (address) => {
    try {
        if (address) {
            const response = await axios_1.default.get(`${fullHost}/v1/accounts/${address}/transactions`, { headers: tronHeaders });
            return response;
        }
    }
    catch (error) {
        console.error("Error while getting Tron transactions:", error.message);
        throw error;
    }
};
exports.getTronTransactions = getTronTransactions;
const estimateTrxForTrc20Transfer = async (fromAddress, toAddress, amount) => {
    try {
        const functionSelector = "transfer(address,uint256)";
        const parameter = [
            { type: "address", value: toAddress },
            { type: "uint256", value: tronWeb.toSun(amount) },
        ];
        const energyNeeded = 80000;
        const trxPerEnergy = 0.000071;
        const energyCost = energyNeeded * trxPerEnergy;
        const bandwidth = await tronWeb.trx.getBandwidth(fromAddress);
        const bandwidthNeeded = 250;
        const bandwidthCost = bandwidth < bandwidthNeeded ? (bandwidthNeeded - bandwidth) / 1000 : 0;
        const totalTrxRequired = energyCost + bandwidthCost;
        console.log(`Estimated TRX required for the transfer: ${totalTrxRequired.toFixed(2)} TRX`);
        return totalTrxRequired;
    }
    catch (error) {
        console.error("Error estimating TRX required:", error);
        throw error;
    }
};
exports.estimateTrxForTrc20Transfer = estimateTrxForTrc20Transfer;
const getTRC20Transactions = async (address) => {
    try {
        if (address) {
            const response = await axios_1.default.get(`${fullHost}/v1/accounts/${address}/transactions/trc20`, { headers: tronHeaders });
            return response;
        }
    }
    catch (error) {
        console.error("Error while getting Tron transactions:", error.message);
        throw error;
    }
};
exports.getTRC20Transactions = getTRC20Transactions;
const transferTron = async (privateKey, tokenContractAddress, receiverAddress, amount, decimal) => {
    try {
        if (isNaN(amount) || isNaN(decimal) || amount <= 0) {
            throw new Error(`Invalid transfer params: amount=${amount}, decimal=${decimal}`);
        }
        const amountInSmallestUnit = (0, helper_1.toWeiCustom)(amount.toString(), decimal);
        console.log("[transferTron] Params:", {
            tokenContractAddress,
            receiverAddress,
            amount,
            decimal,
            amountInSmallestUnit,
        });
        const userAddress = await tronweb_1.TronWeb.address.fromPrivateKey(privateKey);
        if (tokenContractAddress === constants_1.NATIVE) {
            const transaction = await tronWeb.transactionBuilder.sendTrx(receiverAddress, Number(amountInSmallestUnit), userAddress || "");
            const signedTransaction = await tronWeb.trx.sign(transaction, privateKey);
            const receipt = await tronWeb.trx.sendRawTransaction(signedTransaction);
            console.log("Transaction successful, receipt:");
            return receipt;
        }
        else {
            const tronWeb = new tronweb_1.TronWeb({
                fullHost: fullHost,
                headers: tronHeaders,
                privateKey: privateKey,
            });
            const contract = await tronWeb.contract().at(tokenContractAddress);
            const txid = await contract.methods
                .transfer(receiverAddress, amountInSmallestUnit)
                .send({
                from: userAddress,
                feeLimit: 150000000,
            });
            console.log("TRC-20 TX broadcast, TxID:", txid);
            const verifyResult = await (0, exports.verifyTronTransaction)(txid);
            if (verifyResult.status === 'success') {
                console.log("Transaction verified successful! TRC-20 TxID:", txid);
            }
            else if (verifyResult.status === 'timeout') {
                console.warn(`[transferTron] ⚠️ TX ${txid} verification timed out. ` +
                    `TX was broadcast — treating as success to prevent double-spend. ` +
                    `Check: https://tronscan.org/#/transaction/${txid}`);
            }
            else {
                throw new Error(`TRC-20 TX ${txid} FAILED on-chain (${verifyResult.receipt}). ` +
                    `Check: https://tronscan.org/#/transaction/${txid}`);
            }
            return txid;
        }
    }
    catch (error) {
        console.error("Error while transferring TRC20:", error.message);
        throw error;
    }
};
exports.transferTron = transferTron;
const verifyTronTransaction = async (txid, maxRetries = 20, delayMs = 5000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            const txInfo = await tronWeb.trx.getTransactionInfo(txid);
            if (!txInfo || !txInfo.id) {
                console.log(`[verifyTronTx] Attempt ${attempt}/${maxRetries}: TX ${txid} not confirmed yet, retrying...`);
                continue;
            }
            const receiptResult = txInfo?.receipt?.result;
            if (receiptResult === 'SUCCESS') {
                console.log(`[verifyTronTx] ✅ TX ${txid} confirmed SUCCESS on-chain`);
                return { status: 'success' };
            }
            else {
                console.error(`[verifyTronTx] ❌ TX ${txid} FAILED on-chain. Receipt: ${receiptResult || 'UNKNOWN'}`, `Energy used: ${txInfo?.receipt?.energy_usage_total || 0}`, `Fee: ${txInfo?.fee || 0} sun`);
                return { status: 'failed', receipt: receiptResult || 'UNKNOWN' };
            }
        }
        catch (error) {
            console.log(`[verifyTronTx] Attempt ${attempt}/${maxRetries}: Error checking TX ${txid}: ${error.message}`);
            if (attempt === maxRetries) {
                console.error(`[verifyTronTx] ❌ Could not verify TX ${txid} after ${maxRetries} attempts`);
                return { status: 'timeout' };
            }
        }
    }
    return { status: 'timeout' };
};
exports.verifyTronTransaction = verifyTronTransaction;
const estimateAndFundTrc20Gas = async (senderAddress, tokenContractAddress, receiverAddress, amountInSmallestUnit, adminPrivateKey) => {
    const MIN_BUFFER_TRX = 10;
    try {
        let estimatedEnergy = 65000;
        try {
            const functionSelector = "transfer(address,uint256)";
            const parameter = [
                { type: "address", value: receiverAddress },
                { type: "uint256", value: amountInSmallestUnit },
            ];
            const result = await tronWeb.transactionBuilder.triggerConstantContract(tokenContractAddress, functionSelector, {}, parameter, senderAddress);
            if (result?.energy_used) {
                estimatedEnergy = Math.ceil(Number(result.energy_used) * 1.2);
            }
            const MIN_ENERGY_FLOOR = 65000;
            if (estimatedEnergy < MIN_ENERGY_FLOOR) {
                console.log(`[TRC20 Gas] Estimated energy ${estimatedEnergy} below floor ${MIN_ENERGY_FLOOR}, using floor.`);
                estimatedEnergy = MIN_ENERGY_FLOOR;
            }
            console.log(`[TRC20 Gas] Estimated energy for transfer: ${estimatedEnergy} (raw: ${result?.energy_used || 'N/A'})`);
        }
        catch (estError) {
            console.warn(`[TRC20 Gas] Energy estimation failed, using default ${estimatedEnergy}:`, estError.message);
        }
        let energyPriceSun = 420;
        try {
            const chainParams = await tronWeb.trx.getChainParameters();
            const energyFeeParam = chainParams.find((p) => p.key === "getEnergyFee");
            if (energyFeeParam) {
                energyPriceSun = Number(energyFeeParam.value);
            }
            console.log(`[TRC20 Gas] Current energy price: ${energyPriceSun} sun/unit`);
        }
        catch (paramError) {
            console.warn(`[TRC20 Gas] Could not fetch chain params, using default energy price ${energyPriceSun}:`, paramError.message);
        }
        const energyCostTrx = (estimatedEnergy * energyPriceSun) / 1_000_000;
        const bandwidthCostTrx = 0.5;
        const trxNeeded = Math.ceil(energyCostTrx + bandwidthCostTrx + MIN_BUFFER_TRX);
        console.log(`[TRC20 Gas] TRX needed: ${trxNeeded} (energy: ${energyCostTrx.toFixed(2)}, bandwidth: ${bandwidthCostTrx}, buffer: ${MIN_BUFFER_TRX})`);
        const currentBalanceSun = await tronWeb.trx.getBalance(senderAddress);
        const currentBalanceTrx = currentBalanceSun / 1_000_000;
        console.log(`[TRC20 Gas] Sender ${senderAddress} current balance: ${currentBalanceTrx} TRX, needs: ${trxNeeded} TRX`);
        if (currentBalanceTrx >= trxNeeded) {
            console.log(`[TRC20 Gas] ✅ Balance sufficient (${currentBalanceTrx} >= ${trxNeeded}). No funding needed.`);
            return { funded: true, balance: currentBalanceTrx, trxNeeded };
        }
        const deficit = trxNeeded - currentBalanceTrx;
        const fundAmountTrx = Math.ceil(deficit + 1);
        const fundAmountSun = fundAmountTrx * 1_000_000;
        console.log(`[TRC20 Gas] 💰 Funding ${fundAmountTrx} TRX (deficit: ${deficit.toFixed(2)}) from admin wallet...`);
        if (!adminPrivateKey) {
            console.error("[TRC20 Gas] ❌ No admin private key provided. Cannot fund gas.");
            return { funded: false, balance: currentBalanceTrx, trxNeeded };
        }
        const adminAddress = tronweb_1.TronWeb.address.fromPrivateKey(adminPrivateKey);
        const adminTronWeb = new tronweb_1.TronWeb({
            fullHost: fullHost,
            headers: tronHeaders,
            privateKey: adminPrivateKey,
        });
        const transaction = await adminTronWeb.transactionBuilder.sendTrx(senderAddress, fundAmountSun, adminAddress);
        const signedTx = await adminTronWeb.trx.sign(transaction, adminPrivateKey);
        const receipt = await adminTronWeb.trx.sendRawTransaction(signedTx);
        if (receipt?.result) {
            console.log(`[TRC20 Gas] ✅ Funded ${fundAmountTrx} TRX to ${senderAddress} | TX: ${receipt?.transaction?.txID}`);
            await new Promise((resolve) => setTimeout(resolve, 12000));
            const newBalanceSun = await tronWeb.trx.getBalance(senderAddress);
            const newBalanceTrx = newBalanceSun / 1_000_000;
            console.log(`[TRC20 Gas] Post-funding balance: ${newBalanceTrx} TRX`);
            return { funded: true, balance: newBalanceTrx, trxNeeded };
        }
        else {
            console.error("[TRC20 Gas] ❌ Funding TX failed:", receipt);
            return { funded: false, balance: currentBalanceTrx, trxNeeded };
        }
    }
    catch (error) {
        console.error("[TRC20 Gas] ❌ Error in estimateAndFundTrc20Gas:", error.message);
        return { funded: false, balance: 0, trxNeeded: 0 };
    }
};
exports.estimateAndFundTrc20Gas = estimateAndFundTrc20Gas;
const isValidTronAddress = (address) => {
    const result = tronweb_1.TronWeb.isAddress(address);
    return result;
};
exports.isValidTronAddress = isValidTronAddress;
const merchantTronFundWithdraw = async (privateKey, tokenContractAddress, amount, receiverAddress, decimal) => {
    try {
        const userAddress = await tronweb_1.TronWeb.address.fromPrivateKey(privateKey);
        const tronWeb = new tronweb_1.TronWeb({
            fullHost: fullHost,
            headers: tronHeaders,
            privateKey: privateKey,
        });
        if (!userAddress) {
            throw new Error("Invalid private key");
        }
        const TRON_BALANCE = await tronWeb.trx.getBalance(userAddress);
        const AMOUNT_IN_WEI = (0, helper_1.toWeiCustom)(amount, decimal);
        if (tokenContractAddress === constants_1.NATIVE) {
            if (BigInt(TRON_BALANCE) < BigInt(AMOUNT_IN_WEI)) {
                return {
                    status: false,
                    error: "Insufficient TRX balance",
                    data: null,
                };
            }
            const transaction = await tronWeb.transactionBuilder.sendTrx(receiverAddress, AMOUNT_IN_WEI, userAddress);
            const signedTransaction = await tronWeb.trx.sign(transaction, privateKey);
            const receipt = await tronWeb.trx.sendRawTransaction(signedTransaction);
            console.log("Transaction successful, receipt:");
            if (receipt?.result) {
                return {
                    error: null,
                    status: true,
                    data: {
                        transactionHash: receipt?.transaction?.txID,
                        gasUsed: 0,
                        effectiveGasPrice: 0,
                        blockNumber: 0,
                    },
                };
            }
            else {
                return {
                    error: "Transaction Failed",
                    status: false,
                    data: null,
                };
            }
        }
        else {
            const contract = await tronWeb.contract().at(tokenContractAddress);
            const TOKEN_BALANCE = await contract.balanceOf(userAddress).call();
            if (BigInt(TOKEN_BALANCE) < BigInt(AMOUNT_IN_WEI)) {
                return {
                    status: false,
                    error: "Insufficient token balance",
                    data: null,
                };
            }
            const adminPvtKey = config_service_1.ConfigService.keys.TRON_ADMIN_PRIVATE_KEY;
            if (adminPvtKey) {
                const gasResult = await (0, exports.estimateAndFundTrc20Gas)(userAddress, tokenContractAddress, receiverAddress, AMOUNT_IN_WEI, adminPvtKey);
                if (!gasResult.funded) {
                    return {
                        error: `Insufficient TRX gas (need ${gasResult.trxNeeded} TRX, have ${gasResult.balance} TRX) and auto-funding failed`,
                        status: false,
                        data: null,
                    };
                }
            }
            else {
                console.error("[Withdrawal Gas] TRON_ADMIN_PRIVATE_KEY not configured. Cannot auto-fund TRX gas.");
            }
            const txid = await contract.methods
                .transfer(receiverAddress, AMOUNT_IN_WEI)
                .send({
                from: userAddress,
                feeLimit: 150000000,
            });
            console.log("[merchantTronFundWithdraw] TRC-20 TX broadcast, TxID:", txid);
            const verifyResult = await (0, exports.verifyTronTransaction)(txid);
            if (verifyResult.status === 'success') {
                console.log("[merchantTronFundWithdraw] ✅ TRC-20 TX verified:", txid);
            }
            else if (verifyResult.status === 'timeout') {
                console.warn(`[merchantTronFundWithdraw] ⚠️ TX ${txid} verification timed out. ` +
                    `TX was broadcast — treating as success to prevent double-spend.`);
            }
            else {
                return {
                    error: `TRC-20 withdrawal TX ${txid} FAILED on-chain (${verifyResult.receipt})`,
                    status: false,
                    data: null,
                };
            }
            return {
                error: null,
                status: true,
                data: {
                    transactionHash: txid,
                    gasUsed: 0,
                    effectiveGasPrice: 0,
                    blockNumber: 0,
                },
            };
        }
    }
    catch (error) {
        console.error("Error while transferring TRC20:", error.message);
        throw error;
    }
};
exports.merchantTronFundWithdraw = merchantTronFundWithdraw;
const getTronToAddressAllTransactions = async (address) => {
    const last100Transactions = 100;
    const url = `${fullHost}/v1/accounts/${address}/transactions?only_to=true&limit=${last100Transactions}&search_internal=true`;
    const headers = {
        ...tronHeaders,
        accept: "application/json",
    };
    try {
        const response = await axios_1.default.get(url, { headers });
        return response?.data;
    }
    catch (error) {
        console.error("Error fetching data:", error.message);
        throw new Error(error.message);
    }
};
exports.getTronToAddressAllTransactions = getTronToAddressAllTransactions;
const getTronTokenBalance = async (address, tokenAddress, privateKey) => {
    let ethBalanceEther;
    let tokenBalanceEther;
    try {
        console.log("Fetching Tron Token Balance:", {
            address: address,
            tokenAddress: tokenAddress,
        });
        if (!privateKey) {
            throw new Error("Private key is missing in environment variables.");
        }
        const tronWeb = new tronweb_1.TronWeb({
            fullHost: fullHost,
            headers: tronHeaders,
            privateKey: privateKey,
        });
        const balanceInSun = await tronWeb.trx.getBalance(address);
        ethBalanceEther = tronWeb.fromSun(balanceInSun);
        if (tokenAddress === constants_1.NATIVE) {
            return {
                ethBalanceEther,
                tokenBalanceEther,
            };
        }
        console.log("More than native TRX balance available");
        const contract = await tronWeb.contract().at(tokenAddress);
        if (!tronweb_1.TronWeb.isAddress(address)) {
            throw new Error("Invalid Tron address.");
        }
        const balance = await contract.methods.balanceOf(address).call();
        const decimals = await contract.methods.decimals().call();
        tokenBalanceEther = Number(balance) / Math.pow(10, Number(decimals));
        console.log("TRC20 Token Balance:", tokenBalanceEther);
    }
    catch (error) {
        console.error("Error fetching Tron token balance:", error);
    }
    finally {
        return {
            ethBalanceEther,
            tokenBalanceEther,
        };
    }
};
exports.getTronTokenBalance = getTronTokenBalance;
//# sourceMappingURL=tron.helper.js.map