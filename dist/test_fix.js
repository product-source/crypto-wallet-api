"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const evm_helper_1 = require("./src/helpers/evm.helper");
const address = "0x5B18D497d088540c4434Db7824cC9b1b06f02805";
async function test() {
    console.log(`Testing address: ${address}`);
    const result = await (0, evm_helper_1.isValidEVMAddress)(address);
    console.log(`Validation result: ${result}`);
    if (result === true) {
        console.log("SUCCESS: validation worked.");
        process.exit(0);
    }
    else {
        console.error("FAILURE: validation failed.");
        process.exit(1);
    }
}
test();
//# sourceMappingURL=test_fix.js.map