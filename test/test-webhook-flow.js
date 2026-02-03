const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

// Replace these with your actual values
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE';
const APP_ID = 'YOUR_APP_ID_HERE';
const API_KEY = 'YOUR_API_KEY_HERE';
const SECRET_KEY = 'YOUR_SECRET_KEY_HERE';

// Step 1: Configure webhook URL
async function configureWebhook() {
  console.log('\n📝 Step 1: Configuring webhook URL...');
  
  try {
    const response = await axios.put(
      `${API_BASE_URL}/apps/webhook/update?appId=${APP_ID}`,
      {
        webhookUrl: 'http://localhost:4000/webhook',
        webhookSecret: 'test_secret_123'
      },
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Webhook configured:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Error configuring webhook:', error.response?.data || error.message);
    return false;
  }
}

// Step 2: Create a payment link (triggers payment.initiated webhook)
async function createPaymentLink() {
  console.log('\n💰 Step 2: Creating payment link...');
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/payment-link/add`,
      {
        appId: APP_ID,
        apiKey: API_KEY,
        secretKey: SECRET_KEY,
        code: 'USDT.BNB',
        amount: '10',
        buyerEmail: 'test@example.com',
        buyerName: 'Test User',
        itemName: 'Test Product',
        itemNumber: 'ITEM-001',
        invoice: 'INV-001',
        custom: 'custom_data',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        transactionType: 'CRYPTO'
      }
    );
    
    console.log('✅ Payment link created:', response.data.link._id);
    console.log('🔗 Payment URL:', response.data.link.linkURL);
    console.log('📍 Wallet Address:', response.data.link.toAddress);
    console.log('\n⏳ Webhook "payment.initiated" should be triggered now!');
    
    return response.data.link;
  } catch (error) {
    console.error('❌ Error creating payment link:', error.response?.data || error.message);
    return null;
  }
}

// Step 3: Check webhook logs
async function checkWebhookLogs() {
  console.log('\n📊 Step 3: Checking webhook logs...');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/apps/webhook/logs?appId=${APP_ID}&pageNo=1&limitVal=10`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );
    
    console.log('✅ Webhook logs retrieved:');
    console.log(`Total logs: ${response.data.pagination.total}`);
    
    response.data.data.forEach((log, index) => {
      console.log(`\n--- Log ${index + 1} ---`);
      console.log(`Event: ${log.event}`);
      console.log(`Status: ${log.status}`);
      console.log(`Attempts: ${log.attempts}`);
      console.log(`Created: ${log.createdAt}`);
      if (log.errorMessage) {
        console.log(`Error: ${log.errorMessage}`);
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching webhook logs:', error.response?.data || error.message);
    return null;
  }
}

// Run the complete test flow
async function runTest() {
  console.log('🚀 Starting Webhook Test Flow...');
  console.log('=====================================\n');
  
  // Step 1: Configure webhook
  const configured = await configureWebhook();
  if (!configured) {
    console.log('\n❌ Test failed: Could not configure webhook');
    return;
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 2: Create payment link
  const paymentLink = await createPaymentLink();
  if (!paymentLink) {
    console.log('\n❌ Test failed: Could not create payment link');
    return;
  }
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Step 3: Check webhook logs
  await checkWebhookLogs();
  
  console.log('\n=====================================');
  console.log('✅ Test flow completed!');
  console.log('\nNext steps:');
  console.log('1. Send crypto to the wallet address to trigger "payment.confirmed"');
  console.log('2. Wait for auto-withdrawal to trigger "payment.success"');
  console.log('3. Or wait for expiration to trigger "payment.expired"');
}

// Run the test
runTest();
