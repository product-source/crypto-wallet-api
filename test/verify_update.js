const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// CONFIGURATION
const API_URL = 'http://localhost:3001/apps/update'; // Adjust port if needed
const TOKEN = 'YOUR_BEARER_TOKEN_HERE'; // <--- REPLACE THIS WITH A VALID TOKEN
const APP_ID = 'YOUR_APP_ID_HERE'; // <--- REPLACE THIS WITH A VALID APP ID

async function testUpdate() {
    try {
        const form = new FormData();
        // Only updating logo, but you could add name/description too if needed
        // form.append('name', 'Updated App Name'); 

        // Create a dummy image file for testing
        const dummyImagePath = path.join(__dirname, 'test_logo_update.png');
        // Create a simple valid PNG structure
        fs.writeFileSync(dummyImagePath, Buffer.from('89504E470D0A1A0A', 'hex'));

        form.append('logo', fs.createReadStream(dummyImagePath));

        console.log(`Sending request to ${API_URL}?appId=${APP_ID}`);

        const response = await axios.put(`${API_URL}?appId=${APP_ID}`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        console.log('Response Status:', response.status);
        console.log('Response Data:', response.data);

        // Clean up
        fs.unlinkSync(dummyImagePath);

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testUpdate();
