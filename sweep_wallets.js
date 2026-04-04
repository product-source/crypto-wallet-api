/**
 * ============================================================
 *   PAYCOINZ — TEMP WALLET GLOBAL SWEEP SCRIPT
 * ============================================================
 * Connects to MongoDB, decrypts all PaymentLink temp wallets,
 * checks Native + Token balances across EVM / Tron / BTC,
 * and sweeps everything to the designated owner addresses.
 *
 * AUTO-FUNDING ACTIVATED: 
 * If a wallet has TRAPPED tokens, the system will use the 
 * Admin wallets to send EXACTLY the gas needed to unlock them.
 *
 * USAGE:
 *   1. Make sure your .env file is correctly configured in this directory.
 *   2. Run:  node sweep_wallets.js
 *      OR:   node sweep_wallets.js --dryrun   (logs only, no transactions sent)
 * ============================================================
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mongoose = require("mongoose");
const crypto = require("crypto");
const ethers = require("ethers");
const { TronWeb } = require("tronweb");
const axios = require("axios");

// ─────────────────────────────────────────────
//  CONFIG — pulled from .env
// ─────────────────────────────────────────────
const MONGO_URL = process.env.MONGO_URL;
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;
const TATUM_X_API_KEY = process.env.TATUM_X_API_KEY;

const OWNER = {
  EVM:         process.env.EVM_OWNER_ADDRESS  || "0x53C3540761C859A913b83C68Ac90723F063FEF95",
  TRON:        process.env.TRON_OWNER_ADDRESS || "TLknMSciLZxZwv9vkrqMJ61RrgzrUdCWnH",
  BTC_MAINNET: "bc1q0wumaskqdjkxyr4z4p67kfskdue4wcuglje4ca",
  BTC_TESTNET: "tbc1q0wumaskqdjkxyr4z4p67kfskdue4wcuglje4ca",
};

const ADMIN = {
  EVM_PRIVATE_KEY:  process.env.ADMIN_WALLET_PRIVATE_KEY || "",
  TRON_PRIVATE_KEY: process.env.TRON_ADMIN_PRIVATE_KEY   || "",
};

// ─────────────────────────────────────────────
//  ALL KNOWN CHAIN IDs → RPC (mainnet + testnet)
// ─────────────────────────────────────────────
const EVM_CHAINS = {
  "1":   { name: "ETH-Mainnet",   rpc: process.env.ETH_RPC_URL     || "https://eth.llamarpc.com" },
  "56":  { name: "BNB-Mainnet",   rpc: process.env.BNB_RPC_URL     || "https://bsc-dataseed1.binance.org/" },
  "137": { name: "MATIC-Mainnet", rpc: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com" },
  "97":       { name: "BNB-Testnet",  rpc: "https://data-seed-prebsc-1-s1.bnbchain.org:8545" },
  "11155111": { name: "ETH-Sepolia",  rpc: "https://ethereum-sepolia-rpc.publicnode.com" },
  "80002":    { name: "MATIC-Amoy",   rpc: "https://rpc-amoy.polygon.technology" },
};

const TRON_NODE = process.env.TRON_NODE || "https://api.trongrid.io";
const TRON_GRID_API_KEY = process.env.TRON_GRID_API_KEY;
const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const IS_DRY_RUN = process.argv.includes("--dryrun");
const SLEEP_MS = 4000;

// ─────────────────────────────────────────────
//  MONGOOSE SCHEMAS
// ─────────────────────────────────────────────
const paymentLinkSchema = new mongoose.Schema({
  chainId: String, toAddress: String, privateKey: String, tokenAddress: String, status: String,
}, { strict: false });

const tokenSchema = new mongoose.Schema({
  chainId: String, address: String, symbol: String, decimal: Number, code: String,
}, { strict: false });

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function decryptData(encryptedDataStr) {
  try {
    const parsed = JSON.parse(encryptedDataStr);
    const decipher = crypto.createDecipheriv(
      "aes-256-ctr",
      crypto.scryptSync(ENCRYPTION_SECRET, "salt", 32),
      Buffer.from(parsed.iv, "hex")
    );
    return Buffer.concat([decipher.update(Buffer.from(parsed.encryptedData, "hex")), decipher.final()]).toString();
  } catch { return null; }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log  = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);
const warn = (msg) => console.warn(`[${new Date().toISOString()}] ⚠️  ${msg}`);
const logErr  = (msg) => console.error(`[${new Date().toISOString()}] ❌  ${msg}`);
const ok   = (msg) => console.log(`[${new Date().toISOString()}] ✅  ${msg}`);

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
];

function getBtcNetwork(address) {
  if (!address) return null;
  if (address.startsWith("bc1") || address.startsWith("1") || address.startsWith("3")) return "mainnet";
  if (address.startsWith("tb1") || address.startsWith("tbc1") || address.startsWith("m") || address.startsWith("n")) return "testnet";
  return null;
}

// ============================================================
//  EVM SWEEP  (ethers v5) + AUTO-FUNDING
// ============================================================
async function sweepEVMWallet(address, privateKey, chainId, tokens) {
  const chainConf = EVM_CHAINS[String(chainId)];
  if (!chainConf) return;

  const provider = new ethers.providers.JsonRpcProvider(chainConf.rpc);
  const wallet = new ethers.Wallet(privateKey, provider);
  const chainTokens = tokens.filter((t) => String(t.chainId) === String(chainId) && t.address && t.address !== NATIVE_TOKEN_ADDRESS);

  log(`[EVM-${chainConf.name}] Scanning wallet: ${address}`);

  // Step 1: Tokens
  for (const token of chainTokens) {
    try {
      const contract = new ethers.Contract(token.address, ERC20_ABI, wallet);
      const rawBal = await contract.balanceOf(address);
      if (rawBal.isZero()) continue;

      const humanBal = parseFloat(ethers.utils.formatUnits(rawBal, token.decimal || 18));
      log(`[EVM-${chainConf.name}] Found ${humanBal} ${token.symbol} in ${address}`);

      const gasPrice = await provider.getGasPrice();
      const gasEstimate = await contract.estimateGas.transfer(OWNER.EVM, rawBal);
      const gasCost = gasPrice.mul(gasEstimate);
      let nativeBal = await provider.getBalance(address);

      // --- AUTO-FUNDING LOGIC ---
      if (nativeBal.lt(gasCost)) {
        if (!ADMIN.EVM_PRIVATE_KEY) {
          warn(`[EVM-${chainConf.name}] ${address} has ${humanBal} ${token.symbol} BUT only ${ethers.utils.formatEther(nativeBal)} native — INSUFFICIENT GAS. Token TRAPPED (No Admin Key).`);
          continue;
        }

        const buffer = gasCost.div(2); // +50% gas cost as buffer
        const deficit = gasCost.sub(nativeBal).add(buffer);
        
        const adminWallet = new ethers.Wallet(ADMIN.EVM_PRIVATE_KEY, provider);
        const adminBal = await provider.getBalance(adminWallet.address);

        if (adminBal.lt(deficit)) {
          warn(`[EVM-${chainConf.name}] Admin ${adminWallet.address} lacks gas to auto-fund ${address}. Needed: ${ethers.utils.formatEther(deficit)}`);
          continue;
        }

        if (IS_DRY_RUN) {
          log(`[DRY RUN] Would auto-fund ${address} with ${ethers.utils.formatEther(deficit)} native from Admin Wallet to unlock ${token.symbol}.`);
        } else {
          log(`[EVM-${chainConf.name}] Auto-funding ${address} with ${ethers.utils.formatEther(deficit)} native gas...`);
          const adminTx = await adminWallet.sendTransaction({
            to: address,
            value: deficit,
            gasLimit: 21000,
            gasPrice: await provider.getGasPrice(),
          });
          await adminTx.wait();
          ok(`[EVM-${chainConf.name}] Auto-funding confirmed! Proceeding to sweep token...`);
          await sleep(3000); // give the network a second to register the internal balance
        }
      }
      // --------------------------

      if (IS_DRY_RUN) { log(`[DRY RUN] Would sweep ${humanBal} ${token.symbol} → ${OWNER.EVM}`); continue; }

      const tx = await contract.transfer(OWNER.EVM, rawBal);
      await tx.wait();
      ok(`[EVM-${chainConf.name}] Swept ${humanBal} ${token.symbol} → ${OWNER.EVM} | TX: ${tx.hash}`);
      await sleep(3000);
    } catch (e) {
      logErr(`[EVM-${chainConf.name}] Token sweep error (${token.symbol}) at ${address}: ${e.message}`);
    }
  }

  // Step 2: Native Coin
  try {
    const balance = await provider.getBalance(address);
    if (balance.isZero()) { log(`[EVM-${chainConf.name}] ${address} native = 0, skip.`); return; }

    const gasPrice = await provider.getGasPrice();
    const gasLimit = ethers.BigNumber.from(21000);
    const gasCost  = gasPrice.mul(gasLimit);
    const buffer   = ethers.BigNumber.from(10000);

    if (balance.lte(gasCost.add(buffer))) {
      warn(`[EVM-${chainConf.name}] ${address} balance ${ethers.utils.formatEther(balance)} too low to cover gas.`);
      return;
    }

    const sendAmount = balance.sub(gasCost).sub(buffer);
    if (IS_DRY_RUN) { log(`[DRY RUN] Would sweep ${ethers.utils.formatEther(sendAmount)} ${chainConf.name} → ${OWNER.EVM}`); return; }

    const nonce = await provider.getTransactionCount(address, "latest");
    const tx = await wallet.sendTransaction({ to: OWNER.EVM, value: sendAmount, gasLimit, gasPrice, nonce });
    await tx.wait();
    ok(`[EVM-${chainConf.name}] Swept ${ethers.utils.formatEther(sendAmount)} native → ${OWNER.EVM} | TX: ${tx.hash}`);
  } catch (e) {
    logErr(`[EVM-${chainConf.name}] Native sweep error at ${address}: ${e.message}`);
  }
}

// ============================================================
//  TRON SWEEP + AUTO-FUNDING
// ============================================================
async function sweepTronWallet(address, privateKey, tokens) {
  const tronWeb = new TronWeb({ fullHost: TRON_NODE, headers: { "TRON-PRO-API-KEY": TRON_GRID_API_KEY }, privateKey });
  log(`[TRON] Scanning wallet: ${address}`);
  
  const tronTokens = tokens.filter((t) => t.chainId === "TRON" && t.address && t.address !== NATIVE_TOKEN_ADDRESS);

  // Step 1: TRC-20 Tokens
  for (const token of tronTokens) {
    try {
      const contract = await tronWeb.contract().at(token.address);
      const rawBal = await contract.methods.balanceOf(address).call();
      if (!rawBal || BigInt(rawBal.toString()) === 0n) continue;

      const humanBal = Number(rawBal) / Math.pow(10, token.decimal || 6);
      log(`[TRON] Found ${humanBal} ${token.symbol} in ${address}`);

      let trxBal = await tronWeb.trx.getBalance(address);
      
      // --- AUTO-FUNDING LOGIC ---
      if (trxBal < 30_000_000) {
        if (!ADMIN.TRON_PRIVATE_KEY) {
          warn(`[TRON] ${address} has ${humanBal} ${token.symbol} but only ${trxBal / 1e6} TRX gas — TRAPPED (No Admin Key).`);
          continue;
        }

        const deficitSun = 35_000_000 - trxBal; // Send enough to reach 35 TRX safely

        const adminTronWeb = new TronWeb({
          fullHost: TRON_NODE,
          headers: { "TRON-PRO-API-KEY": TRON_GRID_API_KEY },
          privateKey: ADMIN.TRON_PRIVATE_KEY,
        });

        const adminBal = await adminTronWeb.trx.getBalance(adminTronWeb.defaultAddress.base58);
        if (adminBal < deficitSun) {
          warn(`[TRON] Admin wallet (${adminTronWeb.defaultAddress.base58}) lacks TRX to auto-fund ${address}. Needed: ${deficitSun/1e6}, Has: ${adminBal/1e6}.`);
          continue;
        }

        if (IS_DRY_RUN) {
          log(`[DRY RUN] Would auto-fund ${address} with ${deficitSun/1e6} TRX from Admin Wallet to unlock ${token.symbol}.`);
        } else {
          log(`[TRON] Auto-funding ${address} with ${deficitSun/1e6} TRX...`);
          const tx = await adminTronWeb.transactionBuilder.sendTrx(address, deficitSun, adminTronWeb.defaultAddress.base58);
          const signed = await adminTronWeb.trx.sign(tx, ADMIN.TRON_PRIVATE_KEY);
          await adminTronWeb.trx.sendRawTransaction(signed);
          ok(`[TRON] Auto-funding successful. Waiting 15s for blockchain confirmation...`);
          await sleep(15000); // Wait for block confirmation
        }
      }
      // --------------------------

      if (IS_DRY_RUN) { log(`[DRY RUN] Would sweep ${humanBal} ${token.symbol} → ${OWNER.TRON}`); continue; }

      const txid = await contract.methods.transfer(OWNER.TRON, BigInt(rawBal.toString())).send({ from: address, feeLimit: 40_000_000 });
      ok(`[TRON] Swept ${humanBal} ${token.symbol} → ${OWNER.TRON} | TXID: ${txid}`);
      await sleep(5000);
    } catch (e) {
      logErr(`[TRON] Token sweep error (${token.symbol}) at ${address}: ${e.message}`);
    }
  }

  // Step 2: Native TRX
  try {
    const trxBal = await tronWeb.trx.getBalance(address);
    const GAS_RESERVE = 2_000_000; // keep 2 TRX
    if (trxBal <= GAS_RESERVE) { log(`[TRON] ${address} TRX too low (${trxBal / 1e6}), skip.`); return; }

    const sweepAmount = trxBal - GAS_RESERVE;
    if (IS_DRY_RUN) { log(`[DRY RUN] Would sweep ${sweepAmount / 1e6} TRX → ${OWNER.TRON}`); return; }

    const tx = await tronWeb.transactionBuilder.sendTrx(OWNER.TRON, sweepAmount, address);
    const signed = await tronWeb.trx.sign(tx, privateKey);
    const receipt = await tronWeb.trx.sendRawTransaction(signed);

    if (receipt && receipt.result) {
      ok(`[TRON] Swept ${sweepAmount / 1e6} TRX → ${OWNER.TRON} | TXID: ${receipt.transaction && receipt.transaction.txID}`);
    } else {
      warn(`[TRON] TRX sweep did not confirm for ${address}: ${JSON.stringify(receipt)}`);
    }
  } catch (e) {
    logErr(`[TRON] Native TRX sweep error at ${address}: ${e.message}`);
  }
}

// ============================================================
//  BITCOIN SWEEP
// ============================================================
async function sweepBTCWallet(address, privateKey) {
  log(`[BTC] Scanning wallet: ${address}`);
  const network = getBtcNetwork(address);
  if (!network) { warn(`[BTC] Cannot detect network for ${address}, skipping.`); return; }

  const tatumNetwork = network === "mainnet" ? "bitcoin-mainnet" : "bitcoin-testnet";
  const ownerAddress = network === "mainnet" ? OWNER.BTC_MAINNET : OWNER.BTC_TESTNET;
  const configuredNetwork = process.env.TATUM_NETWORK || "bitcoin-testnet";

  if (configuredNetwork !== tatumNetwork) {
    warn(`[BTC] ${address} is ${tatumNetwork} but TATUM_NETWORK=${configuredNetwork}. Skipping to avoid wrong-network API error.`);
    return;
  }

  try {
    const balRes = await axios.get(`https://api.tatum.io/v3/bitcoin/address/balance/${address}`, { headers: { "x-api-key": TATUM_X_API_KEY } });
    const btcBalance = parseFloat(balRes.data && balRes.data.incoming || "0") - parseFloat(balRes.data && balRes.data.outgoing || "0");
    if (btcBalance <= 0.00000546) { log(`[BTC] ${address} = ${btcBalance} BTC (dust), skip.`); return; }

    const estimateRes = await axios.post(
      "https://api.tatum.io/v3/blockchain/estimate",
      { chain: "BTC", type: "TRANSFER", fromAddress: [address], to: [{ address: ownerAddress, value: btcBalance }] },
      { headers: { "x-api-key": TATUM_X_API_KEY, "Content-Type": "application/json" } }
    );
    const fee = parseFloat(estimateRes.data && (estimateRes.data.medium || estimateRes.data.slow) || "0.0001");
    const sendAmount = parseFloat((btcBalance - fee - 0.00001).toFixed(8));

    if (sendAmount <= 0) { warn(`[BTC] ${address} too small after fees (${fee} BTC), skip.`); return; }
    if (IS_DRY_RUN) { log(`[DRY RUN] Would sweep ${sendAmount} BTC → ${ownerAddress} (fee: ${fee})`); return; }

    const sendRes = await axios.post(
      "https://api.tatum.io/v3/bitcoin/transaction",
      { fromAddress: [{ address, privateKey }], to: [{ address: ownerAddress, value: sendAmount }], fee: String(fee), changeAddress: address },
      { headers: { "x-api-key": TATUM_X_API_KEY, "Content-Type": "application/json" } }
    );
    ok(`[BTC] Swept ${sendAmount} BTC → ${ownerAddress} | TXID: ${sendRes.data && sendRes.data.txId}`);
  } catch (e) {
    const detail = (e.response && e.response.data && (e.response.data.message || e.response.data.cause)) || e.message;
    logErr(`[BTC] Sweep error at ${address}: ${detail}`);
  }
}

// ============================================================
//  MAIN
// ============================================================
async function main() {
  if (!MONGO_URL) { logErr("MONGO_URL is not set in .env"); process.exit(1); }
  if (!ENCRYPTION_SECRET) { logErr("ENCRYPTION_SECRET is not set in .env"); process.exit(1); }

  console.log("════════════════════════════════════════════════");
  console.log("  PAYCOINZ GLOBAL TEMP WALLET SWEEP SCRIPT");
  console.log("  Mode:          " + (IS_DRY_RUN ? "🟡 DRY RUN (no transactions)" : "🔴 LIVE"));
  console.log("  Auto-Funding:  " + ((ADMIN.EVM_PRIVATE_KEY || ADMIN.TRON_PRIVATE_KEY) ? "🟢 ENABLED (Trapped Tokens will be auto-funded)" : "❌ DISABLED"));
  console.log("  EVM  →       : " + OWNER.EVM);
  console.log("  TRON →       : " + OWNER.TRON);
  console.log("  BTC(m) →     : " + OWNER.BTC_MAINNET);
  console.log("════════════════════════════════════════════════\n");

  log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URL);
  log("Connected!\n");

  const PaymentLink = mongoose.model("PaymentLink", paymentLinkSchema, "paymentlinks");
  const Token = mongoose.model("Token", tokenSchema, process.env.NETWORK_MODE === "testnet" ? "testTokens" : "tokens");

  const allTokens = await Token.find({}).lean();
  const links = await PaymentLink.find({ privateKey: { $exists: true, $ne: "" } }).lean();
  let swept = 0, skipped = 0, errors = 0;

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const { chainId, toAddress: address, privateKey } = link;

    log("─── [" + (i + 1) + "/" + links.length + "] Wallet: " + address + " | Chain: " + chainId + " ───");

    if (!privateKey) { warn("No privateKey stored, skipping."); skipped++; continue; }
    const decrypted = decryptData(privateKey);
    if (!decrypted) { logErr("Failed to decrypt privateKey for " + address); errors++; continue; }

    try {
      if (chainId === "TRON") await sweepTronWallet(address, decrypted, allTokens);
      else if (chainId === "BTC") await sweepBTCWallet(address, decrypted);
      else if (EVM_CHAINS[String(chainId)]) await sweepEVMWallet(address, decrypted, chainId, allTokens);
      else { warn("Unknown chainId '" + chainId + "' for " + address); skipped++; continue; }
      swept++;
    } catch (e) {
      logErr("Unexpected error on " + address + ": " + e.message);
      errors++;
    }
    await sleep(SLEEP_MS);
  }

  console.log("\n════════════════════════════════════════════════");
  console.log("  SWEEP COMPLETE");
  console.log("  Wallets Processed : " + links.length);
  console.log("  Swept             : " + swept);
  console.log("════════════════════════════════════════════════");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(function(e) { logErr("Fatal error: " + e.message); process.exit(1); });
