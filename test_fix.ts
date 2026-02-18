import { isValidEVMAddress } from "./src/helpers/evm.helper";

const address = "0x5B18D497d088540c4434Db7824cC9b1b06f02805";

async function test() {
    console.log(`Testing address: ${address}`);
    const result = await isValidEVMAddress(address);
    console.log(`Validation result: ${result}`);
    if (result === true) {
        console.log("SUCCESS: validation worked.");
        process.exit(0);
    } else {
        console.error("FAILURE: validation failed.");
        process.exit(1);
    }
}

test();
