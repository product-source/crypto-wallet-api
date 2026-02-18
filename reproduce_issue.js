const Web3 = require("web3");

const isValidEVMAddress = async (address) => {
    try {
        const web3 = new Web3(); // Initialize Web3 instance.
        console.log("Web3 initialized");
        const result = web3.utils.isAddress(address);
        console.log("Validation result:", result);
        return result;
    } catch (error) {
        console.error("Error inside isValidEVMAddress:", error);
        return false;
    }
};

const address = "0x5B18D497d088540c4434Db7824cC9b1b06f02805";
console.log(`Testing address: ${address}`);
isValidEVMAddress(address).then((res) => {
    console.log(`Final Result: ${res}`);
});
