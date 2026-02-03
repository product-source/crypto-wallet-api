const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Merchant's webhook secret (same as configured in the app)
const WEBHOOK_SECRET = 'um7_px5_oiwvN-MVw-yc5XN3QgXMiiik8F7ILRNPlTv-5vFl75Mh0aBlsXJkhnH7';

// Webhook endpoint that receives payment notifications
app.post('/api/payment-webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const event = req.headers['x-webhook-event'];
  
  // Verify webhook signature
  const payload = JSON.stringify(req.body);
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')}`;
  
  if (signature !== expectedSignature) {
    console.log('❌ Invalid webhook signature');
    return res.status(401).send('Unauthorized');
  }
  
  console.log('✅ Webhook verified successfully');
  console.log('Event:', event);
  console.log('Payload:', JSON.stringify(req.body, null, 2));
  
  // Handle different webhook events
  const { event: webhookEvent, paymentId, orderId, amount, currency, status } = req.body;
  
  switch (webhookEvent) {
    case 'payment.initiated':
      console.log(`💰 Payment initiated: ${paymentId}`);
      // Update order status to "awaiting payment"
      break;
      
    case 'payment.confirmed':
      console.log(`✅ Payment confirmed: ${paymentId} - ${amount} ${currency}`);
      // Update order status to "payment received"
      break;
      
    case 'payment.success':
      console.log(`🎉 Payment successful: ${paymentId} - ${amount} ${currency}`);
      // Fulfill order, ship product, etc.
      break;
      
    case 'payment.expired':
      console.log(`⏰ Payment expired: ${paymentId}`);
      // Cancel order, release inventory
      break;
      
    default:
      console.log(`Unknown event: ${webhookEvent}`);
  }
  
  // Always respond with 200 to acknowledge receipt
  res.status(200).send('OK');
});

app.listen(3000, () => {
  console.log('Merchant webhook server listening on port 3000');
  console.log('Webhook URL: http://localhost:3000/api/payment-webhook');
});
