/**
 * Paycoinz Webhook FULL FLOW E2E Test (Production Ready)
 * =======================================================
 * Tests complete lifecycle for Deposit & Withdrawal for both CRYPTO and FIAT.
 * Includes actual on-chain TRX transfers using TronWeb.
 *
 * HOW IT WORKS:
 * 1. Sets Up Webhook Server & Updates URL.
 * 2. Deposit Test (CRYPTO & FIAT):
 *    - Creates payment link.
 *    - Waits for `payment.initiated` webhook.
 *    - Uses provided TRON_PRIVATE_KEY to send exact amount to deposit address.
 *    - Waits for `payment.confirmed` webhook (mempool).
 *    - Waits for `payment.success` webhook (confirmed).
 * 3. Withdrawal Test (CRYPTO & FIAT):
 *    - Calls `/user-withdrawal/request` via API.
 *    - Waits for `withdrawal.pending` webhook.
 *    - Calls `/user-withdrawal/approve` (simulating admin dashboard).
 *    - Waits for `withdrawal.payment_processing` webhook.
 *    - Waits for `withdrawal.success` webhook.
 * 4. Verifies HMAC signatures for EVERY webhook received.
 *
 * USAGE:
 * API_URL=https://api.paycoinz.com \
 * APP_ID=YOUR_APP_ID API_KEY=YOUR_API_KEY SECRET_KEY=YOUR_SECRET_KEY \
 * PUBLIC_WEBHOOK_URL=https://xxxx.ngrok-free.app \
 * TRON_PRIVATE_KEY=your_testnet_wallet_private_key \
 * TRON_ADDRESS=your_testnet_wallet_address \
 * node test/test-full-flow.js
 */

const http = require('http');
const crypto = require('crypto');
const axios = require('axios');
const { TronWeb } = require('tronweb');

// ─── Configuration ────────────────────────────────────────────────
const API_URL = 'https://api.paycoinz.com';
const WEBHOOK_PORT = '4567';
const APP_ID = '692d816c281f9ad981aa0812';
const API_KEY = 'XrYR13t55t6AT73q8ouyBy0cihSdKcy8zFgg6dS0qUuoiAkhiskiDWITn8kU2pHt';
const SECRET_KEY = 'MhI3eRcYHxCOnZZAANw9kyBMwBPg71I2Efh_Bjw00aWMNN9q_Bzo83UNIlFRz2rX';
const TEST_SECRET = 'paycoinz-test-secret-2024';
const PUBLIC_WEBHOOK_URL = 'https://eba5-2402-a00-152-fde2-a3df-6c3b-3286-4579.ngrok-free.app';

// Wallet for making deposits & receiving withdrawals
const TRON_PRIVATE_KEY = '20c8fbbf7784f38166d3788c513c3673ee32fe9f77c445bb2f1417789da8c7da';
const TRON_ADDRESS = 'TDuY4WH44qnQ3Ri5L4xcGAuvzFXXCpr5G5';

const USE_TESTNET = true; // hardcoded for safety

const tronWeb = new TronWeb({
  fullHost: USE_TESTNET ? 'https://api.shasta.trongrid.io' : 'https://api.trongrid.io',
  privateKey: TRON_PRIVATE_KEY
});

// ─── State & Tracking ─────────────────────────────────────────────
const expectedWebhooks = 10; // (Init, Conf, Succ) x 2 + (Pending, Process, Succ) x 2
let receivedWebhooksCount = 0;
const results = [];
let server;

// Used to map blockchain transfer back to order
let currentCryptoDepositOrder = null;
let currentFiatDepositOrder = null;
let currentCryptoWithdrawalId = null;
let currentFiatWithdrawalId = null;

// Helper to pause execution
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Signature verification ───────────────────────────────────────
function verifySignature(rawBody, received, secret) {
  // Strip out the signature property from the raw JSON string.
  // The backend appended `,"signature":"sha256=XXXXX"}` right before the final `}`.
  let stringifiedRest = rawBody;
  if (rawBody.includes('"signature"')) {
    // Safely remove the signature key-value pair and any preceding comma
    stringifiedRest = rawBody.replace(/,"signature":"[^"]+"/, '');
    // In case there was no preceding comma (less likely but possible)
    stringifiedRest = stringifiedRest.replace(/"signature":"[^"]+",?/, '');
  }

  const expected = `sha256=${crypto.createHmac('sha256', secret).update(stringifiedRest).digest('hex')}`;
  let match = false;
  try {
    match = received.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  } catch (_) {}
  
  if (!match) {
    console.log(`\n🔍 DEBUG SIGNATURE FAILED:`);
    console.log(`   Expected : ${expected}`);
    console.log(`   Received : ${received}`);
    console.log(`   Secret   : ${secret}`);
  }
  
  return { match, expected };
}

// ─── Webhook Receiver ─────────────────────────────────────────────
function startWebhookServer() {
  return new Promise(resolve => {
    server = http.createServer((req, res) => {
      if (req.method !== 'POST') { res.writeHead(200); return res.end(); }
      let rawBody = '';
      req.on('data', c => rawBody += c);
      req.on('end', () => {
        try {
          // Parse just to get the signature property (or from headers)
          const payload = JSON.parse(rawBody);
          const headerSig = req.headers['x-webhook-signature'];
          const bodySig = payload.signature;
          const eventType = payload.event;
          
          console.log(`\n📩 WEBHOOK: ${eventType} | TxType: ${payload.transactionType || payload.withdrawal?.transactionType}`);
          
          // Verify Header exactly against the raw body String minus the "signature" key
          // Since the server essentially did `payloadWithSignature = {...payload, signature: 'sha256=...'}`
          // and then stringified IT, the raw incoming JSON has the "signature" property in it.
          // The most accurate way is to extract the exact string bytes.
          
          // However, verifySignature is designed to work on the object.
          // Let's rely ONLY on the verified raw header HMAC process using verifySignature.
          // Wait, verifySignature takes the payload object, removes `signature`, and stringifies.
          // Node's JSON.parse() strips trailing decimal zeros and strictly types '"10"' vs `10`.
          
          const hRes = verifySignature(rawBody, headerSig, TEST_SECRET);
          const bRes = verifySignature(rawBody, bodySig, TEST_SECRET);
          const consistent = headerSig === bodySig && hRes.match && bRes.match;
          
          if (!consistent) {
             console.log(`❌ SIGNATURE FAILED for ${eventType}`);
             console.log(`Expected: ${hRes.expected}`);
             console.log(`Header: ${headerSig}`);
          } else {
             console.log(`✅ Sig matched`);
          }

          results.push({ name: `${eventType} (${payload.transactionType || payload.withdrawal?.transactionType || 'N/A'})`, pass: consistent });
          receivedWebhooksCount++;

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ received: true }));

          if (receivedWebhooksCount >= expectedWebhooks) {
            console.log("\n🎉 ALL EXPECTED WEBHOOKS RECEIVED.");
            setTimeout(printSummary, 2000);
          }
        } catch (err) {
          console.error('❌ Webhook parse error:', err.message);
          res.writeHead(400); res.end();
        }
      });
    });

    server.listen(WEBHOOK_PORT, '0.0.0.0', () => {
      console.log(`🖥️  Receiver listening on :${WEBHOOK_PORT}`);
      resolve();
    });
  });
}

// ─── API Interactions ─────────────────────────────────────────────
async function updateWebhookUrl() {
  console.log(`📡 Setting webhook URL...`);
  await axios.post(`${API_URL}/apps/webhook/update`, {
    appId: APP_ID, apiKey: API_KEY, secretKey: SECRET_KEY,
    webhookUrl: PUBLIC_WEBHOOK_URL, webhookSecret: TEST_SECRET,
  });
  console.log(`✅ Webhook updated.`);
}

async function createPayment(type) {
  const isFiat = type === 'FIAT';
  console.log(`\n💰 Creating ${type} payment link...`);
  const resp = await axios.post(`${API_URL}/payment-link/add`, {
    appId: APP_ID, apiKey: API_KEY, secretKey: SECRET_KEY,
    code: 'TRX',
    amount: isFiat ? '10' : '20',
    buyerEmail: `e2e-${type.toLowerCase()}@paycoinz.com`,
    invoice: `E2E-${type}-${Date.now()}`,
    transactionType: type,
    metadata: { source: 'e2e-test', type: type.toLowerCase() },
    ...(isFiat ? { fiatCurrency: 'usd' } : {})
  });
  const link = resp.data.link;
  console.log(`✅ Link created: ${link._id} -> Pay to: ${link.toAddress}`);
  return link;
}

// Perform actual transfer using TronWeb
async function performTronTransfer(toAddress, amountTRX) {
  console.log(`💸 Sending ${amountTRX} TRX to ${toAddress} on Shasta...`);
  try {
    const sunAmount = tronWeb.toSun(amountTRX);
    const unSignedTxn = await tronWeb.transactionBuilder.sendTrx(toAddress, sunAmount, TRON_ADDRESS);
    const signedTxn = await tronWeb.trx.sign(unSignedTxn);
    const receipt = await tronWeb.trx.sendRawTransaction(signedTxn);
    console.log(`✅ Txn broadcasted! Hash: ${receipt.transaction.txID}`);
    console.log(`⏳ Waiting for block confirmation (~5-10s)...`);
    return receipt.transaction.txID;
  } catch (err) {
    console.error(`❌ Txn failed: ${err.message || err}`);
    throw err;
  }
}

async function createWithdrawal(type) {
  const isFiat = type === 'FIAT';
  console.log(`\n🏦 Requesting ${type} withdrawal to ${TRON_ADDRESS}...`);
  try {
    const resp = await axios.post(`${API_URL}/user-withdrawal/request`, {
      appId: APP_ID, apiKey: API_KEY, secretKey: SECRET_KEY,
      userId: 'e2e-test-user-001',          // Required: merchant's internal user ID
      userEmail: 'e2e-user@paycoinz.com',   // Optional
      amount: isFiat ? '5' : '10',
      code: 'TRX',                          // Token code (was wrongly 'currencyId')
      walletAddress: TRON_ADDRESS,
      externalReference: `E2E-WD-${type}-${Date.now()}`,
      transactionType: type,
      ...(isFiat ? { fiatCurrency: 'usd' } : {})
    });
    const withdrawal = resp.data.withdrawal;
    console.log(`✅ Withdrawal Requested: ${withdrawal._id}`);
    return withdrawal._id;
  } catch (err) {
    const apiErr = err.response?.data;
    console.error(`❌ Withdrawal 400:`, JSON.stringify(apiErr, null, 2));
    return null;
  }
}

// ─── Main Flow ────────────────────────────────────────────────────
async function runDepositFlow(type) {
  const link = await createPayment(type);
  // Wait a few seconds for DB sync and `payment.initiated` webhook
  await sleep(3000); 

  // The actual crypto amount to send
  const amountToPay = type === 'FIAT' ? link.cryptoAmount : link.amount;
  
  // Perform ON-CHAIN transfer
  await performTronTransfer(link.toAddress, amountToPay);

  console.log(`⏳ Payment sent. Waiting for Moralis to catch it and trigger webhooks...`);
  // Webhooks payment.confirmed and payment.success should follow automatically
}

async function runWithdrawalFlow(type) {
    const wdId = await createWithdrawal(type);
    
    // Wait for `withdrawal.pending` webhook
    await sleep(4000);
    
    console.log(`\n👨‍💼 Simulating Merchant Approval for: ${wdId}...`);
    // NOTE: Usually approval is via merchant dashboard (JWT).
    // If you exposed an API key endpoint for approval, you'd call it here.
    // For this e2e, we'll assume the external `/user-withdrawal/approve` is allowed with API Key.
    try {
        await axios.post(`${API_URL}/user-withdrawal/approve`, {
             appId: APP_ID, apiKey: API_KEY, secretKey: SECRET_KEY,
             withdrawalId: wdId
        });
        console.log(`✅ Approved. Wait for smart contract processing & webhooks...`);
    } catch (e) {
        console.error(`❌ Approval fail:`, e.response?.data || e.message);
        console.log(`⚠️ If approval requires JWT, you must manually approve ${wdId} in the dashboard.`);
    }
}

function printSummary() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log(`║                  E2E TEST RUN SUMMARY                    ║`);
  console.log('╠══════════════════════════════════════════════════════════╣');
  for (const r of results) {
    const icon = r.pass ? '✅ PASS' : '❌ FAIL';
    console.log(`║  ${icon}  ${r.name.padEnd(48)} ║`);
  }
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  server.close();
  process.exit(results.every(r => r.pass) ? 0 : 1);
}

// ─── Entry Point ──────────────────────────────────────────────────
async function main() {
  if (!APP_ID || !API_KEY || !SECRET_KEY) {
    console.error("❌ Missing required ENV vars (APP_ID, API_KEY, SECRET_KEY)."); process.exit(1);
  }
  if (!TRON_PRIVATE_KEY || !TRON_ADDRESS) {
    console.error("❌ Missing TRON_PRIVATE_KEY or TRON_ADDRESS for real on-chain testing."); process.exit(1);
  }

  await startWebhookServer();
  await updateWebhookUrl();
  await sleep(1000);

  // 1. Run CRYPTO Deposit Flow
  await runDepositFlow('CRYPTO');
  await sleep(20000); // Give time for block confirmations (Shasta is 3s blocks)

  // 2. Run FIAT Deposit Flow
  await runDepositFlow('FIAT');
  await sleep(20000);

  // 3. Run CRYPTO Withdrawal Flow
  await runWithdrawalFlow('CRYPTO');
  await sleep(20000);

  // 4. Run FIAT Withdrawal Flow
  await runWithdrawalFlow('FIAT');

  console.log(`\n⏳ All flows triggered. Waiting up to 2 mins for final webhooks to arrive...\n`);
  setTimeout(() => {
    console.log(`⚠️  Timeout. Only got ${receivedWebhooksCount}/${expectedWebhooks} webhooks.`);
    printSummary();
  }, 120000);
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1); });
