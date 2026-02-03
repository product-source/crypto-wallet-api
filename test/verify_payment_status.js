const axios = require('axios');

// CONFIGURATION
const API_URL = 'http://localhost:3001/payment-link/get-tx-status';
const PAYMENT_ID = 'YOUR_PAYMENT_ID_HERE'; // <--- REPLACE THIS

async function testPaymentStatus() {
    try {
        console.log(`Sending request to ${API_URL}?paymentId=${PAYMENT_ID}`);

        const response = await axios.get(`${API_URL}?paymentId=${PAYMENT_ID}`);

        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));

        if (response.data.data && response.data.data.logo) {
            console.log('SUCCESS: Logo URL found:', response.data.data.logo);
        } else {
            console.log('WARNING: Logo URL NOT found in response (check if App has a logo)');
        }

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testPaymentStatus();
