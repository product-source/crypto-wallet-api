const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJ1dHZpa2FrYmFyaUBnbWFpbC5jb20iLCJ1c2VySWQiOiI2OTNjMTdjMWViMGU3ZDUzZTg5MmMyMDkiLCJpYXQiOjE3NjcyNTA0ODcsImV4cCI6MTc2NzM1ODQ4N30.hbdOBOHaAZ8vgsf9KOAZahgs31jvOkCuCBLuJBs8WSw';
const APP_ID = '69415df169723e2ccd89a566';

async function checkAppConfig() {
  console.log('🔍 Checking app webhook configuration...\n');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/apps/view?id=${APP_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );
    
    const app = response.data.app;
    
    console.log('App ID:', app._id);
    console.log('Webhook URL:', app.webhookUrl || 'NOT SET');
    console.log('Webhook Secret (encrypted):', app.webhookSecret || 'NOT SET');
    console.log('App SECRET_KEY (decrypted):', app.secretKey);
    console.log('\n📝 Note: If webhookSecret is NOT SET, the system uses SECRET_KEY');
    console.log('\n💡 Your test server should use the SECRET_KEY shown above!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkAppConfig();
