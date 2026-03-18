/**
 * Paycoinz Webhook Signature Verification Test — Production Ready
 * ================================================================
 * Works for both LOCAL and PRODUCTION environments.
 *
 * HOW IT WORKS:
 *   1. Starts a local HTTP server on WEBHOOK_PORT
 *   2. Gets a public URL for it (via ngrok, or via --public-url flag)
 *   3. Updates the app's webhook URL via API → triggers payment.initiated
 *   4. Creates CRYPTO and FIAT payment links
 *   5. Receives webhooks, verifies HMAC-SHA256 signature
 *   6. Prints ✅ PASS or ❌ FAIL and exits
 *
 * ── LOCAL USAGE (default) ──────────────────────────────────────────
 *   node test/test-signature-verify.js
 *   (API must be running on localhost:3001)
 *
 * ── PRODUCTION USAGE with ngrok ────────────────────────────────────
 *   # Step 1: Start ngrok in another terminal pointing to this script's port
 *   #         ngrok http 4567
 *   # Step 2: Copy the ngrok HTTPS URL (e.g. https://xxxx.ngrok-free.app)
 *   # Step 3: Run with env vars pointing to production:
 *
 *   API_URL=https://api.paycoinz.com \
 *   APP_ID=YOUR_PROD_APP_ID \
 *   API_KEY=YOUR_PROD_API_KEY \
 *   SECRET_KEY=YOUR_PROD_SECRET_KEY \
 *   PUBLIC_WEBHOOK_URL=https://xxxx.ngrok-free.app \
 *   node test/test-signature-verify.js
 *
 * ── ENV VARIABLES ───────────────────────────────────────────────────
 *   API_URL             API base URL  (default: http://localhost:3001)
 *   APP_ID              Your App ID
 *   API_KEY             Your API Key
 *   SECRET_KEY          Your Secret Key
 *   PUBLIC_WEBHOOK_URL  Public URL for receiving webhooks (required for production)
 *                       If omitted, http://127.0.0.1:4567 is used (local only)
 *   TEST_SECRET         Signing secret to use (default: paycoinz-test-secret-2024)
 *   WEBHOOK_PORT        Local server port (default: 4567)
 */

const http    = require('http');
const crypto  = require('crypto');
const axios   = require('axios');

// ─── Config from env with sensible defaults ───────────────────────
const API_URL    = 'https://api.paycoinz.com';
const WEBHOOK_PORT = '4567';
const APP_ID     = '692d816c281f9ad981aa0812';
const API_KEY    = 'XrYR13t55t6AT73q8ouyBy0cihSdKcy8zFgg6dS0qUuoiAkhiskiDWITn8kU2pHt';
const SECRET_KEY = 'MhI3eRcYHxCOnZZAANw9kyBMwBPg71I2Efh_Bjw00aWMNN9q_Bzo83UNIlFRz2rX';
const TEST_SECRET = 'paycoinz-test-secret-2024';

// Public URL: required for production (ngrok / any public URL)
// For local dev it auto-fills with 127.0.0.1
const PUBLIC_WEBHOOK_URL =   `https://eba5-2402-a00-152-fde2-a3df-6c3b-3286-4579.ngrok-free.app`;
const isProduction = API_URL.includes('paycoinz.com');
// ─────────────────────────────────────────────────────────────────

const results = [];
let receivedWebhooks = 0;
const expectedWebhooks = 2;
let server;

// ─── Signature verification (same as merchant docs) ──────────────
function verifySignature(payload, received, secret) {
  const { signature, ...rest } = payload;
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(JSON.stringify(rest)).digest('hex')}`;
  let match = false;
  try {
    match = received.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  } catch (_) {}
  return { match, expected };
}

// ─── Webhook receiver ─────────────────────────────────────────────
function startWebhookServer() {
  return new Promise(resolve => {
    server = http.createServer((req, res) => {
      if (req.method !== 'POST') { res.writeHead(200); res.end('webhook test server'); return; }
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const payload     = JSON.parse(body);
          const headerSig   = req.headers['x-webhook-signature'];
          const bodySig     = payload.signature;
          const eventHeader = req.headers['x-webhook-event'];

          console.log('\n' + '═'.repeat(72));
          console.log(`📩 WEBHOOK RECEIVED: ${payload.event}`);
          console.log('═'.repeat(72));
          console.log(`  X-Webhook-Event  : ${eventHeader}`);
          console.log(`  TransactionType  : ${payload.transactionType}`);
          console.log(`  FiatCurrency     : ${payload.fiatCurrency}`);
          console.log(`  FiatAmount       : ${payload.fiatAmount}`);
          console.log(`  Amount (crypto)  : ${payload.amount}`);
          console.log(`  Currency         : ${payload.currency}`);
          console.log(`  Status           : ${payload.status}`);
          console.log('─'.repeat(72));

          // Verify header sig
          const hRes = verifySignature(payload, headerSig, TEST_SECRET);
          console.log(`\n🔐 Header sig check : ${hRes.match ? '✅ PASS' : '❌ FAIL'}`);
          if (!hRes.match) {
            console.log(`   Received : ${headerSig}`);
            console.log(`   Expected : ${hRes.expected}`);
          }

          // Verify body sig
          const bRes = verifySignature(payload, bodySig, TEST_SECRET);
          console.log(`🔐 Body sig check   : ${bRes.match ? '✅ PASS' : '❌ FAIL'}`);
          if (!bRes.match) {
            console.log(`   Received : ${bodySig}`);
            console.log(`   Expected : ${bRes.expected}`);
          }

          // Header === Body
          const consistent = headerSig === bodySig;
          console.log(`🔐 Header === Body   : ${consistent ? '✅ YES' : '❌ MISMATCH'}`);

          results.push({
            name: `${payload.event} (${payload.transactionType || 'N/A'})`,
            pass: hRes.match && bRes.match && consistent,
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ received: true }));

          receivedWebhooks++;
          if (receivedWebhooks >= expectedWebhooks) setTimeout(printSummary, 500);
        } catch (err) {
          console.error('❌ Parse error:', err.message);
          res.writeHead(400); res.end();
        }
      });
    });

    server.listen(WEBHOOK_PORT, '0.0.0.0', () => {
      console.log(`🖥️  Local receiver   : http://localhost:${WEBHOOK_PORT}`);
      console.log(`🌐 Public URL       : ${PUBLIC_WEBHOOK_URL}`);
      resolve();
    });
  });
}

// ─── Update webhook URL ───────────────────────────────────────────
async function updateWebhookUrl() {
  console.log(`\n📡 Setting webhook URL → ${PUBLIC_WEBHOOK_URL}`);
  try {
    await axios.post(`${API_URL}/apps/webhook/update`, {
      appId:         APP_ID,
      apiKey:        API_KEY,
      secretKey:     SECRET_KEY,
      webhookUrl:    PUBLIC_WEBHOOK_URL,
      webhookSecret: TEST_SECRET,
    });
    console.log(`✅ Webhook URL updated (secret forced to: ${TEST_SECRET})`);
  } catch (err) {
    const msg = JSON.stringify(err.response?.data || err.message);
    console.error(`❌ Failed: ${msg}`);
    console.log('\n💡 For HTTPS production URLs, the @IsUrl validator accepts them natively.');
    console.log('   For local testing, require_tld:false was added to webhook.dto.ts.\n');
    process.exit(1);
  }
}

// ─── Create payment ───────────────────────────────────────────────
async function createPayment(type) {
  const isFiat = type === 'FIAT';
  console.log(`\n${isFiat ? '💶' : '💰'} Creating ${type} payment...`);
  try {
    const resp = await axios.post(`${API_URL}/payment-link/add`, {
      appId:           APP_ID,
      apiKey:          API_KEY,
      secretKey:       SECRET_KEY,
      code:            'TRX',
      amount:          isFiat ? '500' : '50',
      buyerEmail:      `${type.toLowerCase()}-sigtest@paycoinz.com`,
      invoice:         `SIG-TEST-${type}-${Date.now()}`,
      transactionType: type,
      metadata:        { test: `${type.toLowerCase()}_sig_verify` },
      ...(isFiat ? { fiatCurrency: 'try' } : {}),
    });
    const l = resp.data.link;
    console.log(`✅ Created: ${l._id}`);
    if (isFiat) {
      console.log(`   FiatAmount   : ${l.fiatAmount} ${l.fiatCurrency}`);
      console.log(`   CryptoAmount : ${l.cryptoAmount} ${l.symbol}`);
      console.log(`   PricePerCoin : ${l.pricePerCoin}`);
    } else {
      console.log(`   Amount : ${l.amount} ${l.symbol}`);
    }
  } catch (err) {
    console.error(`❌ ${type} payment error:`, err.response?.data || err.message);
  }
}

// ─── Summary ──────────────────────────────────────────────────────
function printSummary() {
  const allPass = results.every(r => r.pass) && results.length === expectedWebhooks;
  console.log('\n\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log(`║   ${isProduction ? '🌐 PRODUCTION' : '🖥️  LOCAL     '} — Signature Verification Results         ║`);
  console.log(`║   API: ${API_URL.padEnd(50)} ║`);
  console.log('╠══════════════════════════════════════════════════════════╣');
  for (const r of results) {
    const icon = r.pass ? '✅ PASS' : '❌ FAIL';
    console.log(`║  ${icon}  ${r.name.padEnd(48)} ║`);
  }
  if (results.length < expectedWebhooks) {
    console.log(`║  ⚠️   Only ${results.length}/${expectedWebhooks} webhooks received (check network/URL)           ║`);
  }
  console.log('╠══════════════════════════════════════════════════════════╣');
  if (allPass) {
    console.log('║  🎉  ALL TESTS PASSED — Fix is verified in this env!     ║');
  } else {
    console.log('║  ❌  SOME TESTS FAILED — see details above               ║');
  }
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  server.close();
  process.exit(allPass ? 0 : 1);
}

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log(`║  Paycoinz — Webhook Signature Test  [${isProduction ? 'PRODUCTION' : 'LOCAL     '}]  ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');

  if (isProduction && !PUBLIC_WEBHOOK_URL) {
    console.error('\n❌ Production mode requires PUBLIC_WEBHOOK_URL (e.g. ngrok HTTPS URL)');
    console.error('   Start ngrok: ngrok http 4567');
    console.error('   Then run:');
    console.error(`   API_URL=https://api.paycoinz.com APP_ID=... API_KEY=... SECRET_KEY=... \\`);
    console.error(`   PUBLIC_WEBHOOK_URL=https://xxxx.ngrok-free.app node test/test-signature-verify.js`);
    process.exit(1);
  }

  await startWebhookServer();
  await updateWebhookUrl();
  await new Promise(r => setTimeout(r, 500)); // small delay after URL update

  await createPayment('CRYPTO');
  await createPayment('FIAT');

  console.log(`\n⏳ Waiting for ${expectedWebhooks} webhook(s) — timeout in 60s...\n`);

  setTimeout(() => {
    if (receivedWebhooks < expectedWebhooks) {
      console.log(`\n⚠️  Timeout: received ${receivedWebhooks}/${expectedWebhooks} webhooks`);
      if (isProduction) {
        console.log('   Check that your ngrok URL is still active and reachable');
        console.log('   Check the webhook logs: POST /apps/webhook/logs');
      }
      printSummary();
    }
  }, 60000); // 60s for production (network latency)
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
