const axios = require('axios');

// Your ngrok URL (update this when ngrok restarts)
const NGROK_URL = 'https://6b04d8ed695f.ngrok-free.app';

// API Configuration
const API_BASE_URL = 'http://localhost:3001';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJ1dHZpa2FrYmFyaUBnbWFpbC5jb20iLCJ1c2VySWQiOiI2OTNjMTdjMWViMGU3ZDUzZTg5MmMyMDkiLCJpYXQiOjE3NjcyNTA0ODcsImV4cCI6MTc2NzM1ODQ4N30.hbdOBOHaAZ8vgsf9KOAZahgs31jvOkCuCBLuJBs8WSw';
const APP_ID = '69415df169723e2ccd89a566';
const API_KEY = 'cL1zEO2DjhEZjz5sjefpVw22Nb_hCP0I_rEG6ercOoiEfQYbtKa1bfP66h7lURbq';
const SECRET_KEY = 'aO64JQWqqIfdTo0cxMgjbHwbOE1AefAyAT__CS-0PsDa0jzsqxR86HoNbTfGZ6bw';

async function createFreshPayment() {
  console.log('🚀 Creating fresh payment link to test webhook signature...\n');
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/payment-link/add`,
      {
        appId: APP_ID,
        apiKey: API_KEY,
        secretKey: SECRET_KEY,
        code: 'TRX',
        amount: '100',
        buyerEmail: 'fresh-test@example.com',
        buyerName: 'Fresh Test User',
        itemName: 'Signature Test Product',
        itemNumber: 'SIG-TEST-001',
        invoice: `INV-${Date.now()}`,
        custom: 'signature_validation_test',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        transactionType: 'CRYPTO'
      }
    );
    
    console.log('✅ Fresh payment link created!');
    console.log('Payment ID:', response.data.link._id);
    console.log('Wallet Address:', response.data.link.toAddress);
    console.log('\n⏳ NEW webhook "payment.initiated" should be sent now!');
    console.log('📊 Check your webhook server terminal for the new webhook');
    console.log('✅ This webhook should have VALID signature!\n');
    
    return response.data.link;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

createFreshPayment();
