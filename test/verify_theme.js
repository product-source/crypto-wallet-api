const axios = require('axios');

// CONFIGURATION
const API_URL_UPDATE = 'http://localhost:3001/apps/update';
const API_URL_GET_TX = 'http://localhost:3001/payment-link/get-tx-status';
const TOKEN = 'YOUR_BEARER_TOKEN_HERE'; // <--- REPLACE
const APP_ID = 'YOUR_APP_ID_HERE'; // <--- REPLACE
const PAYMENT_ID = 'YOUR_PAYMENT_ID_HERE'; // <--- REPLACE

async function testTheme() {
    try {
        console.log('--- TEST 1: Updating App Theme to DARK ---');
        await axios.put(`${API_URL_UPDATE}?appId=${APP_ID}`,
            { theme: 'DARK' },
            { headers: { 'Authorization': `Bearer ${TOKEN}` } }
        );
        console.log('App updated to DARK');

        console.log('--- TEST 2: Updating App Theme to WHITE ---');
        await axios.put(`${API_URL_UPDATE}?appId=${APP_ID}`,
            { theme: 'WHITE' },
            { headers: { 'Authorization': `Bearer ${TOKEN}` } }
        );
        console.log('App updated to WHITE');

        console.log(`--- TEST 3: Verifying Theme in Payment Transaction Status ---`);
        const response = await axios.get(`${API_URL_GET_TX}?paymentId=${PAYMENT_ID}`);
        const data = response.data.data;
        console.log('Payment Link Data Theme:', data.theme);

        if (data.theme === 'WHITE') {
            console.log('SUCCESS: Theme matches update');
        } else {
            console.log('WARNING: Theme mismatch (expected WHITE)');
        }

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testTheme();
