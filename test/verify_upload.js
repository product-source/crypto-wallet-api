const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// CONFIGURATION
const API_URL = 'http://localhost:3001/apps/add'; // Adjust port if needed
const TOKEN = 'YOUR_BEARER_TOKEN_HERE'; // <--- REPLACE THIS WITH A VALID TOKEN

async function testUpload() {
    try {
        const form = new FormData();
        form.append('name', 'Test App with Logo');
        form.append('description', 'This is a test app description');

        // Create a dummy image file for testing
        const dummyImagePath = path.join(__dirname, 'test_logo.png');
        // Create a simple 1x1 PNG or just some bytes that look like png signature if validated by extension only
        // Current validation is ONLY extension check: file.originalname.match(/\.(jpg|jpeg|png)$/)
        // So any file content should work as long as name is correct, but let's try to be real-ish
        fs.writeFileSync(dummyImagePath, Buffer.from('89504E470D0A1A0A', 'hex')); // PNG magic number

        form.append('logo', fs.createReadStream(dummyImagePath));

        console.log('Sending request to', API_URL);

        const response = await axios.post(API_URL, form, {
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

testUpload();
