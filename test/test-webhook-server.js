const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// This should match the webhookSecret you set in your app
// If you didn't set a custom webhookSecret, it uses your app's SECRET_KEY
// Based on API logs, your app has a custom webhookSecret set:
const WEBHOOK_SECRET = 'test_secret_123';

app.post('/webhook', (req, res) => {
  console.log('\n========================================');
  console.log('🔔 Webhook Received!');
  console.log('========================================');
  console.log('Time:', new Date().toISOString());
  console.log('Event:', req.headers['x-webhook-event']);
  
  // Verify signature
  const signature = req.headers['x-webhook-signature'];
  
  // Create a copy of the body and remove the signature field
  // because the signature was generated on the payload WITHOUT the signature field
  const payloadToVerify = { ...req.body };
  delete payloadToVerify.signature;
  
  const payloadString = JSON.stringify(payloadToVerify);
  
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payloadString)
    .digest('hex')}`;
  
  if (signature === expectedSignature) {
    console.log('✅ Signature Valid');
  } else {
    console.log('❌ Signature Invalid');
    console.log('Expected:', expectedSignature);
    console.log('Received:', signature);
  }
  
  console.log('\nPayload:');
  console.log(JSON.stringify(req.body, null, 2));
  console.log('========================================\n');
  
  res.status(200).send('OK');
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ Test webhook server running on http://localhost:${PORT}`);
  console.log(`📍 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`🔑 Webhook Secret: ${WEBHOOK_SECRET}`);
  console.log('\nWaiting for webhooks...\n');
});
