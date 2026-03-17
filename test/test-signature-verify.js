/**
 * Webhook Signature Verification Test Script
 * ============================================
 * Tests that the HMAC-SHA256 signature is valid for both CRYPTO and FIAT payment webhooks.
 *
 * BEFORE RUNNING:
 *   1. Make sure crypto-wallet-api is running:  npm run start:dev
 *   2. Wait for NestJS to print "Application is running on: http://..."
 *   3. Run this script:  node test/test-signature-verify.js
 *
 * The script:
 *   - Starts a local HTTP receiver on port 4567
 *   - Updates the app's webhook URL via API
 *   - Creates a CRYPTO payment → receives payment.initiated → checks signature  
 *   - Creates a FIAT payment (500 TRY) → receives payment.initiated → checks signature
 *   - Prints ✅ PASS or ❌ FAIL for each
 */

const http = require('http');
const crypto = require('crypto');
const axios = require('axios');

// ─── Configuration ────────────────────────────────────────────────
const API_BASE_URL = 'http://localhost:3001';
const WEBHOOK_PORT = 4567;
const WEBHOOK_RECEIVER_URL = `http://127.0.0.1:${WEBHOOK_PORT}`;

const APP_ID     = '69415df169723e2ccd89a566';
const API_KEY    = 'cL1zEO2DjhEZjz5sjefpVw22Nb_hCP0I_rEG6ercOoiEfQYbtKa1bfP66h7lURbq';
const SECRET_KEY = 'aO64JQWqqIfdTo0cxMgjbHwbOE1AefAyAT__CS-0PsDa0jzsqxR86HoNbTfGZ6bw';

// We explicitly set this as the webhookSecret in the update call below,
// so the backend will use THIS exact value to sign — removing any ambiguity
// about what secret is currently stored in the DB.
const TEST_WEBHOOK_SECRET = 'paycoinz-test-secret-2024';

// ─────────────────────────────────────────────────────────────────

const results = [];
let receivedWebhooks = 0;
const expectedWebhooks = 2;
let server;

// ─── Signature Verification ───────────────────────────────────────
function verifySignature(payload, receivedSignature, secret) {
  const { signature, ...payloadWithoutSignature } = payload;
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payloadWithoutSignature))
    .digest('hex')}`;

  let match = false;
  try {
    // Use timingSafeEqual to prevent timing attacks
    match = receivedSignature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature));
  } catch (_) {
    match = false;
  }
  return { match, expectedSignature };
}

// ─── Webhook Receiver Server ──────────────────────────────────────
function startWebhookServer() {
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      if (req.method !== 'POST') {
        res.writeHead(200); res.end('Test server running'); return;
      }

      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const headerSig = req.headers['x-webhook-signature'];
          const bodySig   = payload.signature;

          console.log('\n' + '═'.repeat(70));
          console.log(`📩 WEBHOOK: ${payload.event}`);
          console.log('═'.repeat(70));
          console.log(`  TransactionType : ${payload.transactionType}`);
          console.log(`  FiatCurrency    : ${payload.fiatCurrency}`);
          console.log(`  FiatAmount      : ${payload.fiatAmount}`);
          console.log(`  Amount (crypto) : ${payload.amount}`);
          console.log(`  Currency        : ${payload.currency}`);
          console.log(`  Status          : ${payload.status}`);
          console.log('─'.repeat(70));

          // Verify header signature
          const hResult = verifySignature(payload, headerSig, TEST_WEBHOOK_SECRET);
          console.log(`\n🔐 Header Sig check : ${hResult.match ? '✅ PASS' : '❌ FAIL'}`);
          if (!hResult.match) {
            console.log(`  Received : ${headerSig}`);
            console.log(`  Expected : ${hResult.expectedSignature}`);
          }

          // Verify body signature
          const bResult = verifySignature(payload, bodySig, TEST_WEBHOOK_SECRET);
          console.log(`🔐 Body Sig check   : ${bResult.match ? '✅ PASS' : '❌ FAIL'}`);
          if (!bResult.match) {
            console.log(`  Received : ${bodySig}`);
            console.log(`  Expected : ${bResult.expectedSignature}`);
          }

          // Header === Body consistency
          const consistent = headerSig === bodySig;
          console.log(`🔐 Header === Body  : ${consistent ? '✅ YES' : '❌ NO (mismatch between header and body)'}`);

          results.push({
            name: `${payload.event} (${payload.transactionType || 'N/A'})`,
            pass: hResult.match && bResult.match && consistent,
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ received: true }));

          receivedWebhooks++;
          if (receivedWebhooks >= expectedWebhooks) {
            setTimeout(printSummary, 500);
          }
        } catch (err) {
          console.error('❌ Error parsing webhook body:', err.message);
          res.writeHead(400); res.end();
        }
      });
    });

    server.listen(WEBHOOK_PORT, '0.0.0.0', () => {
      console.log(`\n🖥️  Webhook receiver listening on ${WEBHOOK_RECEIVER_URL}`);
      resolve();
    });
  });
}

// ─── Update Webhook URL ───────────────────────────────────────────
async function updateWebhookUrl() {
  console.log(`\n📡 Setting webhook URL → ${WEBHOOK_RECEIVER_URL}`);
  try {
    const resp = await axios.post(`${API_BASE_URL}/apps/webhook/update`, {
      appId:         APP_ID,
      apiKey:        API_KEY,
      secretKey:     SECRET_KEY,
      webhookUrl:    WEBHOOK_RECEIVER_URL,
      webhookSecret: TEST_WEBHOOK_SECRET,  // Force a known signing key
    });
    console.log(`✅ Webhook URL updated successfully`);
    return true;
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('❌ Webhook URL update failed:', JSON.stringify(msg));
    console.log('\n💡 Fix: Make sure the API is compiled with the updated webhook.dto.ts');
    console.log('   (Added require_tld: false to @IsUrl() in src/webhook/dto/webhook.dto.ts)');
    console.log('   Restart the API and try again.\n');
    process.exit(1);
  }
}

// ─── Create Payment Links ─────────────────────────────────────────
async function createPayment(type) {
  const isFiat = type === 'FIAT';
  console.log(`\n${isFiat ? '💶' : '💰'} Creating ${type} payment...`);
  try {
    const body = {
      appId:     APP_ID,
      apiKey:    API_KEY,
      secretKey: SECRET_KEY,
      code: 'TRX',
      amount: isFiat ? '500' : '50',
      buyerEmail: `${type.toLowerCase()}-test@example.com`,
      buyerName:  `${type} Sig Test`,
      invoice:    `INV-${type}-${Date.now()}`,
      transactionType: type,
      metadata: { test: `${type.toLowerCase()}_signature_check` },
      ...(isFiat ? { fiatCurrency: 'try' } : {}),
    };

    const resp = await axios.post(`${API_BASE_URL}/payment-link/add`, body);
    const link = resp.data.link;
    console.log(`✅ Created: ${link._id}`);
    if (isFiat) {
      console.log(`   FiatAmount   : ${link.fiatAmount} ${link.fiatCurrency}`);
      console.log(`   CryptoAmount : ${link.cryptoAmount} ${link.symbol}`);
      console.log(`   PricePerCoin : ${link.pricePerCoin}   ← was a Number, now String`);
    } else {
      console.log(`   Amount : ${link.amount} ${link.symbol}`);
    }
    return link;
  } catch (err) {
    console.error(`❌ ${type} payment creation failed:`, err.response?.data || err.message);
    return null;
  }
}

// ─── Summary ──────────────────────────────────────────────────────
function printSummary() {
  const allPass = results.every(r => r.pass);
  console.log('\n\n');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║         WEBHOOK SIGNATURE VERIFICATION RESULTS       ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  for (const r of results) {
    const icon = r.pass ? '✅ PASS' : '❌ FAIL';
    console.log(`║  ${icon}  ${r.name.padEnd(42)} ║`);
  }
  console.log('╠══════════════════════════════════════════════════════╣');
  if (results.length < expectedWebhooks) {
    console.log(`║  ⚠️  Only ${results.length}/${expectedWebhooks} webhooks received                         ║`);
  } else if (allPass) {
    console.log('║  🎉 ALL TESTS PASSED — Fix is working correctly!    ║');
  } else {
    console.log('║  ❌ SOME TESTS FAILED — see details above           ║');
  }
  console.log('╚══════════════════════════════════════════════════════╝\n');

  server.close();
  process.exit(allPass && results.length === expectedWebhooks ? 0 : 1);
}

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   PAYCOINZ — Webhook Signature Verification Test     ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  await startWebhookServer();
  await updateWebhookUrl();

  // Small delay to ensure API has processed the URL update
  await new Promise(r => setTimeout(r, 500));

  await createPayment('CRYPTO');
  await createPayment('FIAT');

  console.log(`\n⏳ Waiting for ${expectedWebhooks} webhooks (30s timeout)...`);

  setTimeout(() => {
    if (receivedWebhooks < expectedWebhooks) {
      console.log(`\n⚠️  Timeout: received ${receivedWebhooks}/${expectedWebhooks} webhooks`);
      printSummary();
    }
  }, 30000);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
