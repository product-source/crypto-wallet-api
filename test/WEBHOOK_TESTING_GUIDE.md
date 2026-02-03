# Webhook Testing Guide

## Prerequisites

1. Your API server running on `http://localhost:3001`
2. Node.js installed
3. Valid JWT token, App ID, API Key, and Secret Key

---

## Quick Start Testing (5 Minutes)

### **Terminal 1: Start Test Webhook Server**

```bash
cd test
node test-webhook-server.js
```

You should see:
```
✅ Test webhook server running on http://localhost:4000
📍 Webhook URL: http://localhost:4000/webhook
🔑 Webhook Secret: test_secret_123
```

### **Terminal 2: Run Test Flow**

1. **Edit `test-webhook-flow.js`** and replace:
   - `YOUR_JWT_TOKEN_HERE` - Get from login response
   - `YOUR_APP_ID_HERE` - Your app's MongoDB _id
   - `YOUR_API_KEY_HERE` - Your app's API key
   - `YOUR_SECRET_KEY_HERE` - Your app's secret key

2. **Run the test:**
```bash
cd test
node test-webhook-flow.js
```

This will:
- ✅ Configure webhook URL
- ✅ Create payment link (triggers `payment.initiated` webhook)
- ✅ Show webhook logs

---

## Testing All Webhook Events

### **1. Payment Initiated** ✅
**Trigger:** Create a payment link
```bash
node test-webhook-flow.js
```
**Expected:** Webhook server receives `payment.initiated` event

---

### **2. Payment Confirmed** 💰
**Trigger:** Send crypto to the payment link wallet address

**For EVM chains (ETH, BNB, Polygon):**
- Send the exact amount or more to the wallet address
- Wait 30 seconds for the cron job to detect it
- Webhook `payment.confirmed` will be triggered

**For TRON:**
- Send TRX or TRC20 tokens to the wallet address
- Wait 30 seconds for the cron job
- Webhook `payment.confirmed` will be triggered

**For Bitcoin:**
- Send BTC to the wallet address
- Wait 1 minute for the cron job
- Webhook `payment.confirmed` will be triggered

---

### **3. Payment Success** 🎉
**Trigger:** Automatic after payment confirmed

- After `payment.confirmed`, the system automatically withdraws funds
- Wait 10-30 seconds for the withdrawal cron job
- Webhook `payment.success` will be triggered

---

### **4. Payment Expired** ⏰
**Trigger:** Wait for payment link to expire (1 hour by default)

**Quick test (modify expiry time):**
In `payment-link.service.ts`, temporarily change:
```typescript
model.expireTime = moment().add(1, "minutes").unix(); // Instead of 1 hour
```

Then:
1. Create payment link
2. Wait 1 minute
3. Wait 30 seconds for expiry cron job
4. Webhook `payment.expired` will be triggered

---

## Manual API Testing with Postman/cURL

### **1. Configure Webhook**

```bash
curl -X PUT "http://localhost:3001/apps/webhook/update?appId=YOUR_APP_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "http://localhost:4000/webhook",
    "webhookSecret": "test_secret_123"
  }'
```

### **2. Create Payment Link**

```bash
curl -X POST "http://localhost:3001/payment-link/add" \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "YOUR_APP_ID",
    "apiKey": "YOUR_API_KEY",
    "secretKey": "YOUR_SECRET_KEY",
    "code": "USDT.BNB",
    "amount": "10",
    "buyerEmail": "test@example.com",
    "buyerName": "Test User",
    "itemName": "Test Product",
    "transactionType": "CRYPTO"
  }'
```

### **3. View Webhook Logs**

```bash
curl -X GET "http://localhost:3001/apps/webhook/logs?appId=YOUR_APP_ID&pageNo=1&limitVal=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Testing with ngrok (Public URL)

For testing with external services or real blockchain transactions:

### **1. Install ngrok**
```bash
npm install -g ngrok
```

### **2. Start ngrok**
```bash
ngrok http 4000
```

You'll get a public URL like: `https://abc123.ngrok.io`

### **3. Update webhook URL**
```bash
curl -X PUT "http://localhost:3001/apps/webhook/update?appId=YOUR_APP_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://abc123.ngrok.io/webhook",
    "webhookSecret": "test_secret_123"
  }'
```

---

## Webhook Payload Examples

### **payment.initiated**
```json
{
  "event": "payment.initiated",
  "paymentId": "67890xyz",
  "orderId": "67890xyz",
  "amount": "10",
  "currency": "USDT.BNB",
  "status": "PENDING FROM BUYER SIDE",
  "timestamp": 1703598120000,
  "signature": "sha256=abc123...",
  "data": {
    "toAddress": "0x123...",
    "chainId": "56",
    "tokenAddress": "0x55d398..."
  }
}
```

### **payment.confirmed**
```json
{
  "event": "payment.confirmed",
  "paymentId": "67890xyz",
  "orderId": "67890xyz",
  "amount": "10",
  "currency": "USDT.BNB",
  "status": "PARTIALLY SUCCESS",
  "timestamp": 1703598180000,
  "signature": "sha256=def456...",
  "data": {
    "hash": "0xabc...",
    "fromAddress": "0x456...",
    "toAddress": "0x123...",
    "blockNumber": "12345",
    "chainId": "56",
    "recivedAmount": "10.5"
  }
}
```

### **payment.success**
```json
{
  "event": "payment.success",
  "paymentId": "67890xyz",
  "orderId": "67890xyz",
  "amount": "10",
  "currency": "USDT.BNB",
  "status": "SUCCESS",
  "timestamp": 1703598240000,
  "signature": "sha256=ghi789...",
  "data": {
    "hash": "0xabc...",
    "fromAddress": "0x456...",
    "toAddress": "0x789...",
    "recivedAmount": "10.5"
  }
}
```

### **payment.expired**
```json
{
  "event": "payment.expired",
  "paymentId": "67890xyz",
  "orderId": "67890xyz",
  "amount": "10",
  "currency": "USDT.BNB",
  "status": "EXPIRED",
  "timestamp": 1703601720000,
  "signature": "sha256=jkl012...",
  "data": {
    "toAddress": "0x123...",
    "chainId": "56"
  }
}
```

---

## Verifying Webhook Signatures

Merchants should verify signatures to ensure webhooks are authentic:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')}`;
  
  return signature === expectedSignature;
}
```

---

## Troubleshooting

### **Webhook not received?**
1. Check webhook URL is correct
2. Ensure webhook server is running
3. Check firewall/network settings
4. View webhook logs: `GET /apps/webhook/logs`

### **Signature verification failed?**
1. Ensure `webhookSecret` matches on both sides
2. Verify you're using the raw JSON body (not parsed)
3. Check HMAC algorithm is SHA-256

### **Webhook shows FAILED status?**
1. Check webhook logs for error message
2. Ensure webhook endpoint returns 200 status
3. Check webhook endpoint timeout (10 seconds max)
4. System will retry automatically (5 attempts)

### **Payment not triggering webhooks?**
1. Check payment status in database
2. Verify cron jobs are running
3. Check server logs for errors
4. Ensure WebhookService is properly injected

---

## Monitoring Webhook Delivery

Query webhook logs with filters:

```bash
# All webhooks for an app
GET /apps/webhook/logs?appId=xxx

# Only failed webhooks
GET /apps/webhook/logs?appId=xxx&status=FAILED

# Only payment.success events
GET /apps/webhook/logs?appId=xxx&event=payment.success

# Paginated results
GET /apps/webhook/logs?appId=xxx&pageNo=2&limitVal=50
```

---

## Production Checklist

- [ ] Configure production webhook URL (HTTPS required)
- [ ] Set strong webhook secret
- [ ] Implement signature verification
- [ ] Handle webhook retries gracefully
- [ ] Log webhook events for debugging
- [ ] Set up monitoring/alerts for failed webhooks
- [ ] Test all payment scenarios
- [ ] Document webhook integration for your team
