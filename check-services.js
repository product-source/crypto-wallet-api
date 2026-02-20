/**
 * PayCoinz Production Health Check Script
 * Run from crypto-wallet-api folder: node check-services.js
 *
 * Reads .env automatically from same directory.
 */

require("dotenv").config();
const axios = require("axios");
const net = require("net");
const mongoose = require("mongoose");

// ─── Colors ────────────────────────────────────────────────────────────────
const GREEN = "\x1b[32m✅";
const RED = "\x1b[31m❌";
const YELLOW = "\x1b[33m⚠️ ";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

const ok = (msg) => console.log(`${GREEN} ${msg}${RESET}`);
const fail = (msg) => console.log(`${RED} ${msg}${RESET}`);
const warn = (msg) => console.log(`${YELLOW} ${msg}${RESET}`);
const header = (msg) => console.log(`\n${BOLD}━━━ ${msg} ━━━${RESET}`);

const env = process.env;
const results = { passed: 0, failed: 0, warned: 0 };

function pass(msg) { ok(msg); results.passed++; }
function err(msg) { fail(msg); results.failed++; }
function warning(msg) { warn(msg); results.warned++; }

// ─── 1. ENV Presence Check ────────────────────────────────────────────────
header("1. Environment Variables");

const required = [
    "MONGO_URL", "JWT_SECRET", "ENCRYPTION_SECRET",
    "TRON_NODE", "TRON_GRID_API_KEY", "TRON_ADMIN_PRIVATE_KEY", "TRON_ADMIN_ADDRESS",
    "TATUM_X_API_KEY", "TATUM_NETWORK",
    "MORALIS_KEY", "WEB_STREAMER_ID",
    "ETH_RPC_URL", "BNB_RPC_URL", "POLYGON_RPC_URL",
    "SMTP_HOST", "SMTP_PORT", "SMTP_AUTH_EMAIL",
    "TRON_OWNER_ADDRESS", "BTC_OWNER_ADDRESS", "EVM_OWNER_ADDRESS",
];

required.forEach((key) => {
    if (env[key]) {
        pass(`${key} = ${env[key].slice(0, 30)}${env[key].length > 30 ? "..." : ""}`);
    } else {
        err(`${key} is MISSING from .env`);
    }
});

// ─── Helpers ──────────────────────────────────────────────────────────────
const rpc = async (url, method, params = []) => {
    const resp = await axios.post(
        url,
        { jsonrpc: "2.0", id: 1, method, params },
        { timeout: 10000 }
    );
    return resp.data;
};

// ─── 2. MongoDB ───────────────────────────────────────────────────────────
async function checkMongo() {
    header("2. MongoDB");
    try {
        await mongoose.connect(env.MONGO_URL, { serverSelectionTimeoutMS: 8000 });
        pass(`Connected to MongoDB: ${env.MONGO_URL.replace(/\/\/.*@/, "//***@")}`);
        await mongoose.disconnect();
    } catch (e) {
        err(`MongoDB connection failed: ${e.message}`);
    }
}

// ─── 3. TronGrid (TRON) ───────────────────────────────────────────────────
async function checkTron() {
    header("3. TRON (TronGrid)");
    const host = env.TRON_NODE;
    const apiKey = env.TRON_GRID_API_KEY;
    const adminAddr = env.TRON_ADMIN_ADDRESS;

    // 3a. Node health
    try {
        const resp = await axios.get(`${host}/walletsolidity/getnowblock`, {
            headers: { "TRON-PRO-API-KEY": apiKey },
            timeout: 10000,
        });
        if (resp.data?.block_header) {
            pass(`TronGrid node reachable: ${host}`);
            const block = resp.data.block_header.raw_data.number;
            pass(`Latest TRON block: #${block}`);
        } else {
            err(`TronGrid responded but unexpected format`);
        }
    } catch (e) {
        err(`TronGrid node unreachable (${host}): ${e.message}`);
    }

    // 3b. Admin wallet balance
    try {
        const resp = await axios.post(
            `${host}/walletsolidity/getaccount`,
            { address: adminAddr, visible: true },
            { headers: { "TRON-PRO-API-KEY": apiKey }, timeout: 10000 }
        );
        const balance = (resp.data?.balance ?? 0) / 1e6;
        const bandwidth = resp.data?.net_usage ?? 0;
        const freeBandwidth = resp.data?.free_net_usage ?? 0;

        if (balance >= 5) {
            pass(`TRON admin wallet: ${adminAddr}`);
            pass(`TRX balance: ${balance.toFixed(6)} TRX`);
        } else if (balance >= 1.6) {
            warning(`TRX balance LOW (${balance.toFixed(6)} TRX) — needs ≥5 TRX for safe ops`);
        } else {
            err(`TRX balance CRITICAL (${balance.toFixed(6)} TRX) — app creation WILL fail`);
        }

        const freeLeft = 600 - freeBandwidth;
        if (freeLeft > 200) {
            pass(`Free bandwidth remaining: ${freeLeft}/600`);
        } else {
            warning(`Free bandwidth LOW: ${freeLeft}/600 — consider freezing TRX for bandwidth`);
        }
    } catch (e) {
        err(`TRON admin wallet check failed: ${e.message}`);
    }
}

// ─── 4. Tatum BTC API ─────────────────────────────────────────────────────
async function checkTatum() {
    header("4. Tatum BTC API");
    const apiKey = env.TATUM_X_API_KEY;
    const network = env.TATUM_NETWORK; // bitcoin or bitcoin-testnet

    // 4a. Check API key validity
    try {
        const resp = await axios.get(
            `https://api.tatum.io/v3/bitcoin/info`,
            {
                headers: { "x-api-key": apiKey },
                timeout: 10000,
            }
        );
        if (resp.data?.chain) {
            pass(`Tatum BTC API key valid (network: ${network})`);
            pass(`BTC chain: ${resp.data.chain}, blocks: ${resp.data.blocks}`);
        }
    } catch (e) {
        if (e.response?.status === 401 || e.response?.status === 403) {
            err(`Tatum API key INVALID or expired: ${apiKey.slice(0, 30)}...`);
        } else if (e.response?.status === 400) {
            err(`Tatum BTC API returned 400 — check TATUM_NETWORK matches your API key plan (${network})`);
        } else {
            err(`Tatum BTC API unreachable: ${e.message}`);
        }
    }

    // 4b. Admin BTC owner address balance
    const btcOwner = env.BTC_OWNER_ADDRESS;
    if (btcOwner) {
        try {
            const resp = await axios.get(
                `https://api.tatum.io/v3/bitcoin/address/balance/${btcOwner}`,
                { headers: { "x-api-key": apiKey }, timeout: 10000 }
            );
            pass(`BTC owner wallet reachable: ${btcOwner}`);
            pass(`BTC balance: ${resp.data?.incoming - resp.data?.outgoing || 0} satoshis`);
        } catch (e) {
            warning(`BTC owner wallet check failed (${e.response?.status ?? e.message})`);
        }
    }
}

// ─── 5. Moralis ───────────────────────────────────────────────────────────
async function checkMoralis() {
    header("5. Moralis Streams");
    const moralisKey = env.MORALIS_KEY;
    const streamId = env.WEB_STREAMER_ID;

    try {
        const resp = await axios.get(
            `https://api.moralis-streams.com/streams/evm/${streamId}`,
            {
                headers: { "X-API-Key": moralisKey },
                timeout: 10000,
            }
        );
        if (resp.data?.id) {
            pass(`Moralis stream found: ${resp.data.id}`);
            pass(`Stream webhook: ${resp.data.webhookUrl}`);
            pass(`Stream status: ${resp.data.status}`);
        }
    } catch (e) {
        if (e.response?.status === 401) {
            err(`Moralis API key INVALID`);
        } else if (e.response?.status === 404) {
            err(`Moralis stream ID not found: ${streamId}`);
        } else {
            err(`Moralis API failed: ${e.response?.status ?? e.message}`);
        }
    }
}

// ─── 6. EVM RPC Nodes ─────────────────────────────────────────────────────
async function checkEVMRpcs() {
    header("6. EVM RPC Nodes");

    const rpcs = [
        { name: "Ethereum", url: env.ETH_RPC_URL, chainId: env.ETH_CHAIN_ID },
        { name: "BNB Chain", url: env.BNB_RPC_URL, chainId: env.BNB_CHAIN_ID },
        { name: "Polygon", url: env.POLYGON_RPC_URL, chainId: env.POLYGON_CHAIN_ID },
    ];

    for (const { name, url, chainId } of rpcs) {
        if (!url) { err(`${name} RPC URL missing in .env`); continue; }
        try {
            const data = await rpc(url, "eth_blockNumber");
            const block = parseInt(data.result, 16);
            const chainResp = await rpc(url, "eth_chainId");
            const actualChain = parseInt(chainResp.result, 16);

            if (actualChain.toString() === chainId) {
                pass(`${name} RPC: block #${block}, chainId ${actualChain} ✓`);
            } else {
                err(`${name} chainId MISMATCH: .env says ${chainId}, RPC says ${actualChain}`);
            }
        } catch (e) {
            err(`${name} RPC unreachable (${url.slice(0, 40)}...): ${e.message}`);
        }
    }
}

// ─── 7. SMTP ──────────────────────────────────────────────────────────────
async function checkSMTP() {
    header("7. SMTP");
    const host = env.SMTP_HOST;
    const port = parseInt(env.SMTP_PORT || "587");

    return new Promise((resolve) => {
        const socket = net.createConnection(port, host);
        const timeout = setTimeout(() => {
            socket.destroy();
            err(`SMTP ${host}:${port} — connection TIMED OUT`);
            resolve();
        }, 8000);

        socket.on("connect", () => {
            pass(`SMTP reachable: ${host}:${port}`);
            pass(`SMTP email: ${env.SMTP_AUTH_EMAIL}`);
            clearTimeout(timeout);
            socket.destroy();
            resolve();
        });

        socket.on("error", (e) => {
            clearTimeout(timeout);
            err(`SMTP connection failed (${host}:${port}): ${e.message}`);
            resolve();
        });
    });
}

// ─── 8. TRON Owner Wallets ────────────────────────────────────────────────
async function checkOwnerWallets() {
    header("8. Owner Wallet Addresses");

    const addrs = [
        { label: "TRON_OWNER_ADDRESS (fiat receiver)", value: env.TRON_OWNER_ADDRESS },
        { label: "BTC_OWNER_ADDRESS (fiat receiver)", value: env.BTC_OWNER_ADDRESS },
        { label: "EVM_OWNER_ADDRESS (fiat receiver)", value: env.EVM_OWNER_ADDRESS },
        { label: "TRON_ADMIN_ADDRESS", value: env.TRON_ADMIN_ADDRESS },
        { label: "ADMIN_PAYMENTLINK_WITHDRAW_CHARGES_WALLET", value: env.ADMIN_PAYMENTLINK_WITHDRAW_CHARGES_WALLET },
    ];

    addrs.forEach(({ label, value }) => {
        if (value) {
            pass(`${label}: ${value}`);
        } else {
            warning(`${label} not set in .env`);
        }
    });
}

// ─── Run All ──────────────────────────────────────────────────────────────
(async () => {
    console.log(`\n${"═".repeat(60)}`);
    console.log(`${BOLD}  PayCoinz Production Health Check${RESET}`);
    console.log(`  Time: ${new Date().toISOString()}`);
    console.log(`${"═".repeat(60)}`);

    await checkMongo();
    await checkTron();
    await checkTatum();
    await checkMoralis();
    await checkEVMRpcs();
    await checkSMTP();
    await checkOwnerWallets();

    // ─── Summary ───────────────────────────────────────────────────────────
    console.log(`\n${"═".repeat(60)}`);
    console.log(`${BOLD}  SUMMARY${RESET}`);
    console.log(`${"═".repeat(60)}`);
    console.log(`${GREEN} Passed:  ${results.passed}${RESET}`);
    console.log(`${YELLOW} Warnings: ${results.warned}${RESET}`);
    console.log(`${RED} Failed:  ${results.failed}${RESET}`);

    if (results.failed === 0) {
        console.log(`\n${GREEN} All critical checks passed! Production is healthy.${RESET}\n`);
    } else {
        console.log(`\n${RED} ${results.failed} check(s) FAILED — fix before going live!${RESET}\n`);
    }

    process.exit(results.failed > 0 ? 1 : 0);
})();
