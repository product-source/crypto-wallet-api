const axios = require('axios');

// Your ngrok URL (update this when ngrok restarts)
const NGROK_URL = 'https://6b04d8ed695f.ngrok-free.app';

// API Configuration
const API_BASE_URL = 'http://localhost:3001';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJ1dHZpa2FrYmFyaUBnbWFpbC5jb20iLCJ1c2VySWQiOiI2OTNjMTdjMWViMGU3ZDUzZTg5MmMyMDkiLCJpYXQiOjE3NjcyNTA0ODcsImV4cCI6MTc2NzM1ODQ4N30.hbdOBOHaAZ8vgsf9KOAZahgs31jvOkCuCBLuJBs8WSw'; // Get from login
const APP_ID = '69415df169723e2ccd89a566';
const API_KEY = 'cL1zEO2DjhEZjz5sjefpVw22Nb_hCP0I_rEG6ercOoiEfQYbtKa1bfP66h7lURbq';
const SECRET_KEY = 'aO64JQWqqIfdTo0cxMgjbHwbOE1AefAyAT__CS-0PsDa0jzsqxR86HoNbTfGZ6bw';

// Step 1: Configure webhook with ngrok URL
async function configureWebhook() {
  console.log('\n📝 Step 1: Configuring webhook with ngrok URL...');
  console.log(`Webhook URL: ${NGROK_URL}/webhook\n`);
  
  try {
    const response = await axios.put(
      `${API_BASE_URL}/apps/webhook/update?appId=${APP_ID}`,
      {
        webhookUrl: `${NGROK_URL}/webhook`,
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
    console.error('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

// Step 2: Create payment link (triggers payment.initiated)
async function createPaymentLink() {
  console.log('\n💰 Step 2: Creating payment link...');
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/payment-link/add`,
      {
        appId: APP_ID,
        apiKey: API_KEY,
        secretKey: SECRET_KEY,
        code: 'TRX',
        amount: '100',
        buyerEmail: 'test@example.com',
        buyerName: 'Test User',
        itemName: 'Test Product',
        itemNumber: 'ITEM-001',
        invoice: 'INV-001',
        custom: 'test_data',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        transactionType: 'CRYPTO'
      }
    );
    
    console.log('✅ Payment link created!');
    console.log('Payment ID:', response.data.link._id);
    console.log('Payment URL:', response.data.link.linkURL);
    console.log('Wallet Address:', response.data.link.toAddress);
    console.log('\n⏳ Webhook "payment.initiated" should be sent now!');
    console.log('📊 Check ngrok dashboard: http://127.0.0.1:4040');
    
    return response.data.link;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

// Step 3: Check webhook logs
async function checkWebhookLogs() {
  console.log('\n📊 Step 3: Checking webhook delivery logs...');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/apps/webhook/logs?appId=${APP_ID}&pageNo=1&limitVal=5`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );
    
    console.log(`\n✅ Found ${response.data.pagination.total} webhook logs\n`);
    
    response.data.data.forEach((log, index) => {
      console.log(`--- Webhook Log ${index + 1} ---`);
      console.log(`Event: ${log.event}`);
      console.log(`Status: ${log.status}`);
      console.log(`Attempts: ${log.attempts}`);
      console.log(`URL: ${log.webhookUrl}`);
      console.log(`Created: ${new Date(log.createdAt).toLocaleString()}`);
      
      if (log.status === 'SUCCESS') {
        console.log(`✅ Response Status: ${log.responseStatus}`);
      } else if (log.status === 'FAILED') {
        console.log(`❌ Error: ${log.errorMessage}`);
      } else {
        console.log(`⏳ Next Retry: ${log.nextRetryAt ? new Date(log.nextRetryAt).toLocaleString() : 'N/A'}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Main test flow
async function runTest() {
  console.log('🚀 Testing Webhooks with ngrok');
  console.log('=====================================');
  console.log(`ngrok URL: ${NGROK_URL}`);
  console.log(`ngrok Dashboard: http://127.0.0.1:4040`);
  console.log('=====================================\n');
  
  // Configure webhook
  const configured = await configureWebhook();
  if (!configured) {
    console.log('\n❌ Failed to configure webhook. Please check:');
    console.log('1. JWT token is valid (login first)');
    console.log('2. APP_ID is correct');
    console.log('3. API server is running on port 3001');
    return;
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Create payment link
  const paymentLink = await createPaymentLink();
  if (!paymentLink) {
    console.log('\n❌ Failed to create payment link');
    return;
  }
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check logs
  await checkWebhookLogs();
  
  console.log('\n=====================================');
  console.log('✅ Test completed!');
  console.log('\n📊 View webhook requests in ngrok dashboard:');
  console.log('   http://127.0.0.1:4040');
  console.log('\n💡 Tips:');
  console.log('   - ngrok shows all HTTP requests/responses');
  console.log('   - You can replay requests from the dashboard');
  console.log('   - Check webhook server terminal for received webhooks');
}

runTest();
