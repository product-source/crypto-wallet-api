"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeTronAddressWebhook = subscribeTronAddressWebhook;
exports.unsubscribeTronAddressWebhook = unsubscribeTronAddressWebhook;
exports.getTronAccountViaTatum = getTronAccountViaTatum;
exports.getTronTrc20TransactionsViaTatum = getTronTrc20TransactionsViaTatum;
exports.getTronTransactionsViaTatum = getTronTransactionsViaTatum;
exports.getCachedTronBalance = getCachedTronBalance;
const axios_1 = __importDefault(require("axios"));
const config_service_1 = require("../config/config.service");
const TATUM_BASE_URL = "https://api.tatum.io";
function getTatumHeaders() {
    return {
        "x-api-key": config_service_1.ConfigService.keys.TATUM_X_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
    };
}
async function subscribeTronAddressWebhook(walletAddress) {
    try {
        const networkType = config_service_1.ConfigService.keys.NETWORK_MODE === "mainnet" ? "mainnet" : "testnet";
        const webhookUrl = `${config_service_1.ConfigService.keys.API_BASE_URL}tatum-webhook/tron`;
        console.log(`[Tatum] Subscribing Tron address ${walletAddress} to webhook → ${webhookUrl} (${networkType})`);
        const response = await axios_1.default.post(`${TATUM_BASE_URL}/v4/subscription?type=${networkType}`, {
            type: "ADDRESS_EVENT",
            attr: {
                chain: "TRON",
                address: walletAddress,
                url: webhookUrl,
            },
        }, { headers: getTatumHeaders() });
        const subscriptionId = response.data?.id;
        console.log(`[Tatum] Subscribed successfully. Subscription ID: ${subscriptionId}`);
        return subscriptionId;
    }
    catch (error) {
        console.error("[Tatum] Failed to subscribe Tron address:", error?.response?.data || error.message);
        return null;
    }
}
async function unsubscribeTronAddressWebhook(subscriptionId) {
    try {
        if (!subscriptionId)
            return false;
        console.log(`[Tatum] Unsubscribing webhook. Subscription ID: ${subscriptionId}`);
        await axios_1.default.delete(`${TATUM_BASE_URL}/v4/subscription/${subscriptionId}`, { headers: getTatumHeaders() });
        console.log(`[Tatum] Unsubscribed successfully.`);
        return true;
    }
    catch (error) {
        console.error("[Tatum] Failed to unsubscribe:", error?.response?.data || error.message);
        return false;
    }
}
async function getTronAccountViaTatum(address) {
    try {
        const response = await axios_1.default.get(`${TATUM_BASE_URL}/v3/tron/account/${address}`, { headers: getTatumHeaders() });
        return response.data;
    }
    catch (error) {
        console.error("[Tatum] Failed to get Tron account:", error?.response?.data || error.message);
        return null;
    }
}
async function getTronTrc20TransactionsViaTatum(address) {
    try {
        const response = await axios_1.default.get(`${TATUM_BASE_URL}/v3/tron/transaction/account/${address}/trc20`, { headers: getTatumHeaders() });
        return response.data;
    }
    catch (error) {
        console.error("[Tatum] Failed to get TRC20 transactions:", error?.response?.data || error.message);
        return null;
    }
}
async function getTronTransactionsViaTatum(address) {
    try {
        const response = await axios_1.default.get(`${TATUM_BASE_URL}/v3/tron/transaction/account/${address}`, { headers: getTatumHeaders() });
        return response.data;
    }
    catch (error) {
        console.error("[Tatum] Failed to get Tron transactions:", error?.response?.data || error.message);
        return null;
    }
}
const balanceCache = new Map();
const CACHE_TTL_MS = 60_000;
async function getCachedTronBalance(address) {
    const cached = balanceCache.get(address);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.balance;
    }
    try {
        const account = await getTronAccountViaTatum(address);
        const balance = account?.balance
            ? Number(account.balance) / 1_000_000
            : 0;
        balanceCache.set(address, { balance, timestamp: Date.now() });
        return balance;
    }
    catch (error) {
        console.error("[Tatum] getCachedTronBalance error:", error.message);
        return cached?.balance || 0;
    }
}
//# sourceMappingURL=tatum-tron.helper.js.map