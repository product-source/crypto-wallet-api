const axios = require('axios');

// Your ngrok URL
const NGROK_URL = 'https://6b04d8ed695f.ngrok-free.app';

// Replace these with your actual values
const API_BASE_URL = 'http://localhost:3001';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im5ld3NsZXR0ZXJAY29pbnBlcmEuY29tIiwidXNlcklkIjoiNjkzYzAzMzhmYWUyYmRmOTJlOTM3OGIyIiwiaXNBZG1pbiI6dHJ1ZSwiaWF0IjoxNzY3MjQ5OTMzLCJleHAiOjE3NjczNTc5MzN9.lvcXP6EevzgAW6YbfoBz8Bh_DHj3w2L96eomkR-1o-4'; // Get from login
const APP_ID = 'YOUR_APP_ID_HERE';

async function configureNgrokWebhook() {
  console.log('🔧 Configuring webhook with ngrok URL...\n');
  
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
    
    console.log('✅ Webhook configured successfully!');
    console.log('📍 Webhook URL:', `${NGROK_URL}/webhook`);
    console.log('🔑 Webhook Secret: test_secret_123');
    console.log('\nResponse:', response.data);
    
    console.log('\n📝 Next Steps:');
    console.log('1. Make sure test-webhook-server.js is running on port 4000');
    console.log('2. Create a payment link to trigger webhooks');
    console.log('3. Check ngrok dashboard at http://127.0.0.1:4040 to see requests');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: You need to login first to get a valid JWT token');
      console.log('   POST http://localhost:3001/auth/login');
    }
  }
}

configureNgrokWebhook();
