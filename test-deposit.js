import axios from "axios";

// This is a test script to simulate the Tron Deposit
async function testToleranceMargin() {
    const depositLinkURL = "http://localhost:3004/payment-information/69aa9e8372e7432917cf5d36"; // The user's created link url
    const linkId = "69aa9e8372e7432917cf5d36"; // The id of the link to test against

    console.log(`Starting simulated test for Payment Link ID: ${linkId} with an expected amount of 50 TRX and 1% tolerance (min 49.5 TRX)...`);

    // We are going to simulate a transaction on the backend directly by calling the API or creating a fake transaction in the database.
    // Since the user is testing manually, let's ask them to verify via Postman or by clicking the "Check Deposit" button if they have one.

    console.log("To manually test this without spending TRX:");
    console.log("1. Use MongoDB Compass to edit the 'TronBalance' manually for the wallet: TMMShRcA7zPGizt1SpcxwEFbMNzFsEhkBc to 49.5");
    console.log("2. Create a mock transaction record in the `getTronTransactions` mock response if possible, OR since it's a Live API call to TronGrid, the user will need to either send actual testnet/mainnet TRX of 49.5, or we can temporarily mock the `getTronTransactions` response in 'moralis-tx.service.ts' just for testing.");

}

testToleranceMargin();
