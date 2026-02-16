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
exports.formatDate = exports.trimAddress = exports.formatNumber = exports.generateInvoiceNumber = exports.betweenRandomNumber = void 0;
exports.fromWeiCustom = fromWeiCustom;
exports.toWeiCustom = toWeiCustom;
exports.getCoingeckoSymbol = getCoingeckoSymbol;
exports.getTatumPrice = getTatumPrice;
exports.sumBalances = sumBalances;
exports.isValidWalletAddress = isValidWalletAddress;
exports.txExplorer = txExplorer;
exports.calculateTaxes = calculateTaxes;
const index_1 = require("./../constants/index");
const bitcoin = __importStar(require("bitcoinjs-lib"));
const config_service_1 = require("../config/config.service");
const tron_helper_1 = require("./tron.helper");
const web3_1 = __importDefault(require("web3"));
const constants_1 = require("../constants");
const axios_1 = __importDefault(require("axios"));
const betweenRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};
exports.betweenRandomNumber = betweenRandomNumber;
function fromWeiCustom(balance, decimals) {
    const balanceInStr = balance.toString();
    const decimal = Number(decimals);
    const paddedBalance = balanceInStr.padStart(decimal + 1, "0");
    const integerPart = paddedBalance.substring(0, paddedBalance.length - decimal);
    const fractionalPart = paddedBalance.substring(paddedBalance.length - decimal);
    return `${integerPart}.${fractionalPart}`;
}
function toWeiCustom(amount, decimals) {
    const amountInStr = amount.toString();
    const decimal = Number(decimals);
    const [integerPart, fractionalPart = ""] = amountInStr.split(".");
    const paddedFractionalPart = fractionalPart
        .padEnd(decimal, "0")
        .substring(0, decimal);
    const result = integerPart + paddedFractionalPart;
    const trimmedResult = result.replace(/^0+/, "");
    return trimmedResult || "0";
}
function getCoingeckoSymbol(normalSymbol) {
    switch (normalSymbol) {
        case "AVAX":
            return "avalanche-2";
        case "BNB":
            return "binancecoin";
        case "BTC":
            return "bitcoin";
        case "ETH":
            return "ethereum";
        case "USDC":
            return "usd-coin";
        case "TRX":
            return "tron";
        case "USDT":
            return "tether";
        default:
            return normalSymbol;
    }
}
async function getTatumPrice(currency, basePair = "USD") {
    try {
        const symbol = currency.toUpperCase();
        const base = basePair.toUpperCase();
        const tatumUrl = `https://api.tatum.io/v3/tatum/rate/${symbol}?basePair=${base}`;
        try {
            const response = await axios_1.default.get(tatumUrl, {
                headers: {
                    "x-api-key": config_service_1.ConfigService.keys.TATUM_X_API_KEY,
                    accept: "application/json",
                },
            });
            if (response.data && response.data.value) {
                return Number(response.data.value);
            }
        }
        catch (err) {
            if (base !== "USD" && symbol !== "USD") {
                const priceInUSD = await getTatumPrice(symbol, "USD");
                const usdInBase = await getTatumPrice("USD", base);
                if (priceInUSD && usdInBase) {
                    return priceInUSD * usdInBase;
                }
            }
            throw err;
        }
        return null;
    }
    catch (error) {
        console.error("Error fetching Tatum price:", error?.response?.data || error.message);
        return null;
    }
}
function sumBalances(data) {
    const networkTotals = {};
    data.forEach((addressData) => {
        const balances = addressData.balances;
        Object.keys(balances).forEach((network) => {
            const results = balances[network]?.result || [];
            results.forEach((token) => {
                if (token.balance && !isNaN(token.balance)) {
                    const balance = BigInt(token.balance);
                    if (!networkTotals[network]) {
                        networkTotals[network] = BigInt(0);
                    }
                    networkTotals[network] += balance;
                }
            });
        });
    });
    const formattedTotals = {};
    Object.keys(networkTotals).forEach((network) => {
        formattedTotals[network] = networkTotals[network].toString();
    });
    return formattedTotals;
}
function isValidWalletAddress(address, chianId) {
    try {
        if (chianId === constants_1.BTC_CHAIN_ID) {
            const network = config_service_1.ConfigService.keys.TATUM_NETWORK == "bitcoin-testnet"
                ? bitcoin.networks.testnet
                : bitcoin.networks.bitcoin;
            bitcoin.address.toOutputScript(address, network);
            return true;
        }
        else if (chianId === index_1.TRON_CHAIN_ID) {
            return (0, tron_helper_1.isValidTronAddress)(address);
        }
        else if (index_1.EVM_CHAIN_ID_LIST.includes(chianId)) {
            const web3 = new web3_1.default();
            const isValid = web3.utils.isAddress(address);
            return isValid;
        }
        else {
            return false;
        }
    }
    catch (error) {
        return false;
    }
}
const generateInvoiceNumber = () => {
    const timestamp = Date.now();
    const randomNumber = Math.floor(Math.random() * 90000) + 10000;
    const invoiceNumber = `INV-${timestamp}-${randomNumber}`;
    return invoiceNumber;
};
exports.generateInvoiceNumber = generateInvoiceNumber;
const formatNumber = (input, decimalPlace) => {
    if (!(input && decimalPlace)) {
        return 0;
    }
    let str = input.toString();
    let dotIndex = str.indexOf(".");
    if (dotIndex === -1) {
        return str;
    }
    let preDot = str.substring(0, dotIndex + 1);
    let postDot = str.substring(dotIndex + 1, dotIndex + decimalPlace + 1);
    return preDot + postDot;
};
exports.formatNumber = formatNumber;
const trimAddress = (address, firstChar, lastChar) => {
    if (!address || typeof address !== "string") {
        return "";
    }
    if (address.length <= firstChar + lastChar) {
        return address;
    }
    else {
        return address.slice(0, firstChar) + "..." + address.slice(-lastChar);
    }
};
exports.trimAddress = trimAddress;
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const formattedDate = `${day}-${monthNames[monthIndex]}-${year} ${hours % 12 || 12}:${minutes < 10 ? "0" + minutes : minutes}${hours >= 12 ? " PM" : " AM"}`;
    return formattedDate;
};
exports.formatDate = formatDate;
async function txExplorer(chainId, txHash) {
    switch (chainId) {
        case index_1.ETH_CHAIN_ID:
            return {
                explorerURL: `${config_service_1.ConfigService.keys.ETH_EXPLORER_URL || "https://sepolia.etherscan.io/tx/"}${txHash}`,
            };
        case index_1.BNB_CHAIN_ID:
            return {
                explorerURL: `${config_service_1.ConfigService.keys.BNB_EXPLORER_URL || "https://testnet.bscscan.com/tx/"}${txHash}`,
            };
        case index_1.POLYGON_CHAIN_ID:
            return {
                explorerURL: `${config_service_1.ConfigService.keys.POLYGON_EXPLORER_URL || "https://amoy.polygonscan.com/tx/"}${txHash}`,
            };
        case "43113":
            return {
                explorerURL: `https://testnet.avascan.info/blockchain/pulsar/tx/${txHash}`,
            };
        case constants_1.BTC_CHAIN_ID:
            return {
                explorerURL: `${config_service_1.ConfigService.keys.BTC_EXPLORER_URL || "https://mempool.space/testnet/tx/"}${txHash}`,
            };
        case index_1.TRON_CHAIN_ID:
            return {
                explorerURL: `${config_service_1.ConfigService.keys.TRON_EXPLORER_URL || "https://shasta-tronscan.on.btfs.io/#/transaction/"}${txHash}`,
            };
        default:
            throw new Error("Unsupported chainId");
    }
}
async function calculateTaxes(fullAmount, adminPaymentLinksCharges) {
    console.log("Calculating Tax Amount : ", {
        fullAmount,
        adminPaymentLinksCharges,
    });
    let merchantAmount = 0;
    let adminAmount = 0;
    try {
        merchantAmount = fullAmount / (1 + adminPaymentLinksCharges / 100);
        adminAmount = fullAmount - merchantAmount;
    }
    catch (error) {
        console.log("Error in calculateTaxes- ", error);
    }
    return {
        merchantAmount,
        adminAmount,
    };
}
//# sourceMappingURL=helper.js.map