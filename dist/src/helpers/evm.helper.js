"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMnemonic = exports.getEvmWalletFromPrivateKey = exports.generateEvmWallet = exports.getWeb3TokenContract = exports.getWeb3 = exports.isValidEVMAddress = void 0;
exports.evmCryptoBalanceCheck = evmCryptoBalanceCheck;
exports.getNetwork = getNetwork;
exports.getERC20TxFee = getERC20TxFee;
exports.evmNativeTokenTransferToPaymentLinks = evmNativeTokenTransferToPaymentLinks;
exports.evmERC20TokenTransfer = evmERC20TokenTransfer;
exports.evmNativeTokenTransferFromPaymentLinks = evmNativeTokenTransferFromPaymentLinks;
exports.getERC20TransferTxFee = getERC20TransferTxFee;
exports.deposit_bnb_for_gas_fee = deposit_bnb_for_gas_fee;
exports.withdrawEvmFund = withdrawEvmFund;
exports.getEVMNativeBalance = getEVMNativeBalance;
exports.merchantEvmFundWithdraw = merchantEvmFundWithdraw;
const ethers_1 = require("ethers");
const config_service_1 = require("../config/config.service");
const constants_1 = require("../constants");
const tokenAbi_service_1 = require("../utils/tokenAbi.service");
const web3_1 = require("web3");
const helper_1 = require("./helper");
const moralis_1 = __importDefault(require("moralis"));
const routerV2Abi_service_1 = require("../utils/routerV2Abi.service");
const payment_enum_1 = require("../payment-link/schema/payment.enum");
const isValidEVMAddress = async (address) => {
    try {
        const web3 = new web3_1.Web3();
        const result = web3.utils.isAddress(address);
        return result;
    }
    catch (error) {
        return false;
    }
};
exports.isValidEVMAddress = isValidEVMAddress;
const getWeb3 = async (chainId) => {
    const rpc = getNetwork(chainId).rpc;
    const web3 = new web3_1.Web3(rpc);
    return web3;
};
exports.getWeb3 = getWeb3;
const getWeb3TokenContract = (chainId, tokenContractAddress) => {
    const rpc = getNetwork(chainId).rpc;
    const web3 = new web3_1.Web3(rpc);
    const contract = new web3.eth.Contract(tokenAbi_service_1.tokenABI, tokenContractAddress);
    return {
        web3,
        contract,
    };
};
exports.getWeb3TokenContract = getWeb3TokenContract;
const generateEvmWallet = (mnemonic, index) => {
    let ethNode = ethers_1.ethers.utils.HDNode.fromMnemonic(mnemonic);
    const account = ethNode.derivePath(`m/44'/60'/0'/0/${index}`);
    const wallet = {
        address: account.address,
        privateKey: account.privateKey,
        mnemonic: account.mnemonic,
        index: index,
    };
    return wallet;
};
exports.generateEvmWallet = generateEvmWallet;
const getEvmWalletFromPrivateKey = async (privateKey, name, walletType, id) => {
    let walletDetails = new ethers_1.Wallet(privateKey);
    walletDetails = {
        address: walletDetails.address,
        privateKey: privateKey,
        mnemonic: walletDetails.mnemonic,
    };
    const wallet = {
        name: name,
        id: id,
        walletType: walletType,
        data: {
            evm: walletDetails,
        },
    };
    return wallet;
};
exports.getEvmWalletFromPrivateKey = getEvmWalletFromPrivateKey;
const generateMnemonic = () => {
    const mnemonic = ethers_1.ethers.utils.entropyToMnemonic(ethers_1.ethers.utils.randomBytes(16));
    return mnemonic;
};
exports.generateMnemonic = generateMnemonic;
async function evmCryptoBalanceCheck(RPC_URL, tokenAddress, walletAddress) {
    try {
        const provider = new ethers_1.ethers.providers.JsonRpcProvider(RPC_URL);
        if (tokenAddress === constants_1.NATIVE) {
            const balance = await provider.getBalance(walletAddress);
            return balance;
        }
        else {
            const tokenContract = new ethers_1.ethers.Contract(tokenAddress, tokenAbi_service_1.tokenABI, provider);
            const balance = await tokenContract.balanceOf(walletAddress);
            return balance;
        }
    }
    catch (e) {
        console.error("Error in evmCryptoTransfer:", e);
    }
}
function getNetwork(chainId) {
    switch (chainId.toString()) {
        case constants_1.ETH_CHAIN_ID:
            return {
                network: "Ethereum",
                symbol: "ETH",
                rpc: config_service_1.ConfigService.keys.ETH_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/HZGTgTPiqB408bYkAdUFeDOTedqp4DBA",
                explorerURL: config_service_1.ConfigService.keys.ETH_EXPLORER_URL || "https://sepolia.etherscan.io/tx/",
                tokenType: "ERC20",
            };
        case constants_1.BNB_CHAIN_ID:
            return {
                network: "BNB Smart Chain",
                symbol: "BNB",
                rpc: config_service_1.ConfigService.keys.BNB_RPC_URL || "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
                explorerURL: config_service_1.ConfigService.keys.BNB_EXPLORER_URL || "https://testnet.bscscan.com/tx/",
                tokenType: "BEP20",
            };
        case constants_1.POLYGON_CHAIN_ID:
            return {
                network: "Polygon",
                symbol: "MATIC",
                rpc: config_service_1.ConfigService.keys.POLYGON_RPC_URL || "https://polygon-amoy.g.alchemy.com/v2/HZGTgTPiqB408bYkAdUFeDOTedqp4DBA",
                explorerURL: config_service_1.ConfigService.keys.POLYGON_EXPLORER_URL || "https://amoy.polygonscan.com/tx/",
            };
        default:
            throw new Error("Unsupported chainId");
    }
}
function getDecimalUnit(decimal) {
    const units = {
        "1": "wei",
        "3": "kwei",
        "6": "mwei",
        "9": "gwei",
        "12": "szabo",
        "15": "finney",
        "18": "ether",
    };
    return units[decimal.toString()] || "Unit not found";
}
async function getERC20TxFee(chainId, senderAddress, receiverAddress, contractAddress, amount, decimal, adminPaymentLinksCharges, adminPaymentLinksChargesWallet) {
    try {
        let web3;
        let contract;
        const web3Token = await (0, exports.getWeb3TokenContract)(chainId, contractAddress);
        web3 = web3Token.web3;
        contract = web3Token.contract;
        let merchantAmount = amount;
        let adminAmount = 0;
        let adminChargeAmount = 0;
        let adminGas = 0;
        let merchantGas = 0;
        let gasPrice = await web3.eth.getGasPrice();
        if (adminPaymentLinksCharges > 0) {
            adminChargeAmount = merchantAmount / (1 + adminPaymentLinksCharges / 100);
            adminAmount = merchantAmount - adminChargeAmount;
            merchantAmount = merchantAmount - adminAmount;
            adminAmount = web3.utils.toWei(adminAmount.toString(), getDecimalUnit(decimal));
            adminGas = await contract.methods
                .transfer(adminPaymentLinksChargesWallet, adminAmount.toString())
                .estimateGas({
                from: senderAddress,
            });
        }
        merchantAmount = web3.utils.toWei(merchantAmount.toString(), getDecimalUnit(decimal));
        merchantGas = await contract.methods
            .transfer(receiverAddress, merchantAmount)
            .estimateGas({
            from: senderAddress,
        });
        console.log("--------- GetERC20TxFee function run successfully ---------");
        return {
            adminGas,
            merchantGas,
            totalGas: adminGas + merchantGas,
            gasPrice,
        };
    }
    catch (error) {
        console.log("-- *************** Error in getERC20TxFee function : ", error.message);
        return {
            adminGas: null,
            merchantGas: null,
            totalGas: null,
            gasPrice: null,
        };
    }
}
async function evmNativeTokenTransferToPaymentLinks(chainId, nativeAmount, recipientAddress) {
    let receipt = null;
    try {
        const adminWalletPrivateKey = config_service_1.ConfigService.keys.ADMIN_WALLET_PRIVATE_KEY;
        const web3 = await (0, exports.getWeb3)(chainId);
        const account = web3.eth.accounts.privateKeyToAccount(adminWalletPrivateKey);
        web3.eth.accounts.wallet.add(account);
        const senderAddress = account.address;
        const gasPrice = await web3.eth.getGasPrice();
        const checksumAddress = web3.utils.toChecksumAddress(recipientAddress);
        const gasLimit = await web3.eth.estimateGas({
            from: senderAddress,
            to: checksumAddress,
            value: nativeAmount,
        });
        const tx = {
            from: senderAddress,
            to: recipientAddress,
            value: nativeAmount,
            gas: gasLimit,
            gasPrice,
        };
        const signedTx = await web3.eth.accounts.signTransaction(tx, adminWalletPrivateKey);
        receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        return receipt;
    }
    catch (e) {
        console.error("----- ********************* ---- Error in evmCryptoTransfer:", e);
        return receipt;
    }
}
async function evmERC20TokenTransfer(chainId, paymentLinkPrivateKey, txCost, tokenContractAddress, amount, merchantAddress, decimal, adminPaymentLinksCharges, adminPaymentLinksChargesWallet) {
    try {
        let web3 = null;
        let contract = null;
        let adminAmountInWei = null;
        let adminAmountCharge = null;
        let receipt1 = null;
        let receipt2 = null;
        const web3Token = await (0, exports.getWeb3TokenContract)(chainId, tokenContractAddress);
        web3 = web3Token.web3;
        contract = web3Token.contract;
        const account = web3.eth.accounts.privateKeyToAccount(paymentLinkPrivateKey);
        web3.eth.accounts.wallet.add(account);
        const senderAddress = account.address;
        const AMOUNT_IN_WEI = web3.utils.toWei(amount.toString(), getDecimalUnit(decimal));
        let merchantRemainingAmountInWei = BigInt(AMOUNT_IN_WEI);
        if (adminPaymentLinksCharges > 0) {
            adminAmountCharge =
                parseFloat(AMOUNT_IN_WEI) / (1 + adminPaymentLinksCharges / 100);
            adminAmountInWei = BigInt(AMOUNT_IN_WEI) - BigInt(adminAmountCharge);
            merchantRemainingAmountInWei =
                BigInt(AMOUNT_IN_WEI) - BigInt(adminAmountInWei);
            const adminTx = {
                from: senderAddress,
                to: tokenContractAddress,
                gasPrice: txCost.gasPrice,
                gas: txCost.adminGas,
                data: contract.methods
                    .transfer(adminPaymentLinksChargesWallet, adminAmountInWei.toString())
                    .encodeABI(),
            };
            const signedTx1 = await web3.eth.accounts.signTransaction(adminTx, paymentLinkPrivateKey);
            receipt1 = await web3.eth.sendSignedTransaction(signedTx1.rawTransaction);
        }
        const currentNonce = await web3.eth.getTransactionCount(senderAddress, "pending");
        const merchantTx = {
            from: senderAddress,
            to: tokenContractAddress,
            gasPrice: txCost.gasPrice,
            gas: txCost.merchantGas,
            nonce: currentNonce,
            data: contract.methods
                .transfer(merchantAddress, merchantRemainingAmountInWei.toString())
                .encodeABI(),
        };
        try {
            let signedTx2 = await web3.eth.accounts.signTransaction(merchantTx, paymentLinkPrivateKey);
            receipt2 = await web3.eth.sendSignedTransaction(signedTx2.rawTransaction);
        }
        catch (error) {
            console.error("Transaction error:", error);
        }
        return {
            receipt1,
            receipt2,
        };
    }
    catch (e) {
        console.error("Error in evmERC20TokenTransfer:", e.message);
        return {
            receipt1: null,
            receipt2: null,
        };
    }
}
async function evmNativeTokenTransferFromPaymentLinks(chainId, paymentLinkPrivateKey, fullAmount, merchantAddress, decimal, adminPaymentLinksCharges, adminPaymentLinksChargesWallet, currentWithdrawStatus) {
    console.log("evmNativeTokenTransferFromPaymentLinks : ", {
        chainId,
        paymentLinkPrivateKey,
        fullAmount,
        merchantAddress,
        decimal,
        adminPaymentLinksCharges,
        adminPaymentLinksChargesWallet,
    });
    let txCost = {
        adminGas: 0,
        merchantGas: 0,
        gasPrice: 0,
        totalGas: 0,
    };
    const web3 = await (0, exports.getWeb3)(chainId);
    let adminReceipt = null;
    let merchantReceipt = null;
    const tax = await (0, helper_1.calculateTaxes)(fullAmount, adminPaymentLinksCharges);
    console.log("Tax is : ", tax);
    let adminAmount = tax.adminAmount;
    let merchantAmount = tax.merchantAmount;
    txCost.gasPrice = Number(await web3.eth.getGasPrice());
    console.log("adminAmount and merchantAmount 1 : ", adminAmount, merchantAmount);
    if (adminAmount > 0) {
        adminAmount = (0, helper_1.toWeiCustom)(adminAmount, decimal);
    }
    merchantAmount = (0, helper_1.toWeiCustom)(merchantAmount, decimal);
    console.log("adminAmount and merchantAmount 2 : ", adminAmount, merchantAmount);
    const account = web3.eth.accounts.privateKeyToAccount(paymentLinkPrivateKey);
    web3.eth.accounts.wallet.add(account);
    const senderAddress = account.address;
    const adminTxData = {
        from: senderAddress,
        to: adminPaymentLinksChargesWallet,
        value: adminAmount,
    };
    const merchantTxData = {
        from: senderAddress,
        to: merchantAddress,
        value: merchantAmount,
    };
    if (adminAmount > 0) {
        txCost.adminGas = Number(await web3.eth.estimateGas(adminTxData));
    }
    const updatedMerchantValue = merchantAmount - txCost.adminGas * txCost.gasPrice - 10000000;
    console.log("updatedMerchantValue : ", updatedMerchantValue, txCost.adminGas);
    txCost.merchantGas = Number(await web3.eth.estimateGas({
        from: senderAddress,
        to: merchantAddress,
        value: updatedMerchantValue,
    }));
    console.log("txConst 1 : ", txCost);
    const merchantValueAfterGas = merchantAmount -
        100 -
        (txCost?.adminGas + txCost?.merchantGas) * txCost?.gasPrice;
    console.log("ADMIn and merchant : ", txCost?.adminGas, txCost?.merchantGas, txCost?.gasPrice, merchantValueAfterGas);
    try {
        if (adminAmount > 0 &&
            currentWithdrawStatus !== payment_enum_1.WithdrawPaymentStatus.ADMIN_CHARGES) {
            console.log("also transfer admin fee --------------------------------------------------------");
            const adminTx = {
                ...adminTxData,
                gas: txCost.adminGas,
                gasPrice: txCost.gasPrice,
            };
            const signedAdminTx = await web3.eth.accounts.signTransaction(adminTx, paymentLinkPrivateKey);
            adminReceipt = await web3.eth.sendSignedTransaction(signedAdminTx.rawTransaction);
        }
        console.log("Now transfer merchant fee --------------------------------------------------");
        const currentNonce = await web3.eth.getTransactionCount(senderAddress, "pending");
        const merchantTx = {
            ...merchantTxData,
            nonce: currentNonce,
            gas: txCost.merchantGas,
            gasPrice: txCost.gasPrice,
            value: merchantValueAfterGas,
        };
        const signedMerchantTx = await web3.eth.accounts.signTransaction(merchantTx, paymentLinkPrivateKey);
        merchantReceipt = await web3.eth.sendSignedTransaction(signedMerchantTx.rawTransaction);
        console.log("RRRRR : ", merchantValueAfterGas, adminAmount, decimal);
        console.log("--*-*-*- : ", (0, helper_1.fromWeiCustom)(merchantValueAfterGas, decimal));
        return {
            adminReceipt,
            merchantReceipt,
            merchantAmount: (0, helper_1.fromWeiCustom)(merchantValueAfterGas, decimal),
            adminAmount: (0, helper_1.fromWeiCustom)(adminAmount, decimal),
        };
    }
    catch (error) {
        console.log("Error in Transaction Native token from paymentLink : ", error);
        return {
            adminReceipt,
            merchantReceipt,
        };
    }
}
async function getERC20TransferTxFee(rpcURL, tokenContractAddress, tokenAmount, decimals, receiverAddress, senderAddress) {
    let gasFeeInWei;
    let gasFeeInEther;
    try {
        const web3 = new web3_1.Web3(rpcURL);
        const gasPrice = await web3.eth.getGasPrice();
        const tokenContract = new web3.eth.Contract(tokenAbi_service_1.tokenABI, tokenContractAddress);
        const tokenAmountInWei = web3.utils.toWei(tokenAmount, decimals);
        const gasEstimate = await tokenContract.methods
            .transfer(receiverAddress, tokenAmountInWei)
            .estimateGas({
            from: senderAddress,
        });
        gasFeeInWei = gasEstimate * gasPrice;
        gasFeeInEther = web3.utils.fromWei(gasFeeInWei.toString(), "ether");
    }
    catch (e) {
        console.error("Error in transaction fee estimation:", e);
    }
    finally {
        return {
            gasFeeInWei,
            gasFeeInEther,
        };
    }
}
async function deposit_bnb_for_gas_fee(chainId, privateKey, tokenContractAddress, receiverAddress, tokenAmount, paymentLinkAddress) {
    try {
        const network = getNetwork(chainId);
        const web3 = new web3_1.Web3(network?.rpc);
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        web3.eth.accounts.wallet.add(account);
        const tokenContract = new web3.eth.Contract(tokenAbi_service_1.tokenABI, tokenContractAddress);
        const tokenDecimals = Number(await tokenContract.methods.decimals().call());
        const gasFee = await getERC20TransferTxFee(network?.rpc, tokenContractAddress, tokenAmount, tokenDecimals, receiverAddress, account.address);
        const nonce = await web3.eth.getTransactionCount(account.address);
        const gasPrice = await web3.eth.getGasPrice();
        const gasLimit = 21000;
        const tx = {
            from: account.address,
            to: paymentLinkAddress,
            nonce: nonce,
            value: gasFee.gasFeeInWei,
            gas: gasLimit,
            gasPrice: gasPrice,
        };
        const signTx = await web3.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signTx.rawTransaction);
        return receipt;
    }
    catch (error) {
        console.log("Error in deposit_bnb_for_gas_fee : ", error);
    }
}
async function withdrawEvmFund(chainId, privateKey, tokenContractAddress, Amount, receiverAddress) {
    try {
        const network = getNetwork(chainId);
        const web3 = new web3_1.Web3(network?.rpc);
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        web3.eth.accounts.wallet.add(account);
        const gasPrice = await web3.eth.getGasPrice();
        const nonce = await web3.eth.getTransactionCount(account.address);
        if (tokenContractAddress === constants_1.NATIVE) {
            const gasPrice = await web3.eth.getGasPrice();
        }
        else {
            const tokenContract = new web3.eth.Contract(tokenAbi_service_1.tokenABI, tokenContractAddress);
            const tokenDecimals = Number(await tokenContract.methods.decimals().call());
            const amountInWei = (0, helper_1.toWeiCustom)(Amount, tokenDecimals);
            const gas = await tokenContract.methods
                .transfer(receiverAddress, amountInWei)
                .estimateGas({
                from: account.address,
            });
            const tx = {
                from: account.address,
                to: tokenContractAddress,
                gas,
                gasPrice,
                nonce,
                data: tokenContract.methods
                    .transfer(receiverAddress, amountInWei)
                    .encodeABI(),
            };
            const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            return receipt;
        }
    }
    catch (error) {
        console.log("Error in withdrawFund : ", error.message);
        return { error: error.message };
    }
}
async function getEVMNativeBalance(walletAddress) {
    let balances = {
        bsc: 0,
        eth: 0,
        matic: 0,
        avax: 0,
    };
    try {
        const bscResponse = await moralis_1.default.EvmApi.balance.getNativeBalancesForAddresses({
            chain: config_service_1.ConfigService.keys.MORALIS_BSC_CHAIN || "0x61",
            walletAddresses: walletAddress,
        });
        balances.bsc = Number(await bscResponse.toJSON()[0].total_balance_formatted);
        const ethResponse = await moralis_1.default.EvmApi.balance.getNativeBalancesForAddresses({
            chain: config_service_1.ConfigService.keys.MORALIS_ETH_CHAIN || "0xaa36a7",
            walletAddresses: walletAddress,
        });
        balances.eth = Number(await ethResponse.toJSON()[0].total_balance_formatted);
        const maticResponse = await moralis_1.default.EvmApi.balance.getNativeBalancesForAddresses({
            chain: config_service_1.ConfigService.keys.MORALIS_POLYGON_CHAIN || "0x13882",
            walletAddresses: walletAddress,
        });
        balances.matic = Number(await maticResponse.toJSON()[0].total_balance_formatted);
        const avaxResponse = await moralis_1.default.EvmApi.balance.getNativeBalancesForAddresses({
            chain: "0xa86a",
            walletAddresses: walletAddress,
        });
        balances.avax = Number(await avaxResponse.toJSON()[0].total_balance_formatted);
    }
    catch (error) {
        console.log("Error getting native balances : ", error.message);
    }
    finally {
        return balances;
    }
}
const getSwapContractAddresses = (chainId) => {
    switch (chainId.toString()) {
        case constants_1.ETH_CHAIN_ID:
            return {
                router: "",
                factory: "",
            };
        case constants_1.POLYGON_CHAIN_ID:
            return {
                router: "",
                factory: "",
            };
        case constants_1.BNB_CHAIN_ID:
            return {
                router: "0x9ac64cc6e4415144c455bd8e4837fea55603e5c3",
                factory: "0xB7926C0430Afb07AA7DEfDE6DA862aE0Bde767bc",
                WETH: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
            };
        case "43113":
            return {
                router: "",
                factory: "",
            };
        case "BTC":
            return {
                router: "",
                factory: "",
            };
        case "TRON":
            return {
                router: "",
                factory: "",
            };
        default:
            throw new Error("Unsupported chainId");
    }
};
async function merchantEvmFundWithdraw(chainId, privateKey, tokenContractAddress, Amount, receiverAddress, decimal, swapTokenAddress) {
    console.log("Merchant transaction data : ", {
        chainId,
        privateKey,
        tokenContractAddress,
        Amount,
        receiverAddress,
        decimal,
        swapTokenAddress,
    });
    try {
        const network = getNetwork(chainId);
        const web3 = new web3_1.Web3(network?.rpc);
        const ACCOUNT = web3.eth.accounts.privateKeyToAccount(privateKey);
        web3.eth.accounts.wallet.add(ACCOUNT);
        const gasPrice = await web3.eth.getGasPrice();
        const CHECKSUM_RECEIVER_ADDRESS = web3.utils.toChecksumAddress(receiverAddress);
        const AMOUNT_IN_WEI = web3.utils.toWei(Amount.toString(), getDecimalUnit(decimal));
        const NATIVE_BALANCE = await web3.eth.getBalance(ACCOUNT.address);
        const EXPIRE_TIME = Math.floor(Date.now() / 1000) + 60 * 10;
        if (swapTokenAddress) {
            let path = [tokenContractAddress, swapTokenAddress];
            const isNativeSwap = path[0].toLowerCase() === constants_1.NATIVE.toLowerCase() ||
                path[1].toLowerCase() === constants_1.NATIVE.toLowerCase();
            const Tokens = getSwapContractAddresses(chainId);
            const tokenContract = new web3.eth.Contract(tokenAbi_service_1.tokenABI, path[0]);
            const approvedAmount = await tokenContract.methods
                .allowance(ACCOUNT.address, Tokens.router)
                .call();
            if (BigInt(String(approvedAmount)) < BigInt(AMOUNT_IN_WEI)) {
                const gas = await tokenContract.methods
                    .approve(Tokens.router, constants_1.AMOUNT_TO_APPROVE)
                    .estimateGas({
                    from: ACCOUNT.address,
                });
                const approveTx = tokenContract.methods
                    .approve(Tokens.router, constants_1.AMOUNT_TO_APPROVE)
                    .send({ from: ACCOUNT.address, gas: gas.toString(), gasPrice: gasPrice.toString() });
                const receipt = await approveTx;
                console.log("Transaction approved successfully!");
            }
            else {
                console.log("Don't need to approve the contract address");
            }
            const swapContract = new web3.eth.Contract(routerV2Abi_service_1.routerV2Abi, Tokens.router);
            if (!isNativeSwap) {
                const nonce = await web3.eth.getTransactionCount(ACCOUNT.address);
                const gas = await swapContract.methods
                    .swapExactTokensForTokens(AMOUNT_IN_WEI, 0, path, receiverAddress, EXPIRE_TIME)
                    .estimateGas({
                    from: ACCOUNT.address,
                });
                const receipt = await swapContract.methods
                    .swapExactTokensForTokens(AMOUNT_IN_WEI, 0, path, receiverAddress, EXPIRE_TIME)
                    .send({
                    from: ACCOUNT.address,
                    nonce: nonce.toString(),
                    gas: gas.toString(),
                    gasPrice: gasPrice.toString(),
                });
                console.log("Swap Token 2 Token  transaction confirmed:");
                return {
                    error: null,
                    status: true,
                    data: receipt,
                };
            }
            else {
                const nonce = await web3.eth.getTransactionCount(ACCOUNT.address);
                const gas = await tokenContract.methods
                    .swapExactTokensForETH(AMOUNT_IN_WEI, path, receiverAddress, EXPIRE_TIME)
                    .estimateGas({
                    from: ACCOUNT.address,
                });
                const receipt = await swapContract.methods
                    .swapExactTokensForETH(AMOUNT_IN_WEI, path, receiverAddress, EXPIRE_TIME)
                    .send({
                    from: ACCOUNT.address,
                    gas: gas.toString(),
                    gasPrice: gasPrice.toString(),
                    nonce: nonce.toString(),
                });
                console.log("Swap Token 2 Native transaction confirmed:");
                return {
                    error: null,
                    status: true,
                    data: receipt,
                };
            }
        }
        else {
            if (tokenContractAddress === constants_1.NATIVE) {
                if (BigInt(NATIVE_BALANCE) < BigInt(AMOUNT_IN_WEI)) {
                    console.log("Insufficient balance to withdraw.");
                    return {
                        error: "Insufficient balance to withdraw.",
                        status: false,
                        data: null,
                    };
                }
                const gasLimit = await web3.eth.estimateGas({
                    from: ACCOUNT.address,
                    to: CHECKSUM_RECEIVER_ADDRESS,
                    value: AMOUNT_IN_WEI,
                });
                const nonce = await web3.eth.getTransactionCount(ACCOUNT.address);
                const tx = {
                    from: ACCOUNT.address,
                    to: CHECKSUM_RECEIVER_ADDRESS,
                    value: AMOUNT_IN_WEI,
                    nonce,
                    gas: gasLimit,
                    gasPrice,
                };
                const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
                const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
                console.log("Transaction successful: ");
                return {
                    error: null,
                    status: true,
                    data: receipt,
                };
            }
            else {
                const tokenContract = new web3.eth.Contract(tokenAbi_service_1.tokenABI, tokenContractAddress);
                const merchantBalance = await tokenContract.methods
                    .balanceOf(ACCOUNT.address)
                    .call({
                    from: ACCOUNT.address,
                });
                if (BigInt(String(merchantBalance)) < BigInt(AMOUNT_IN_WEI)) {
                    console.log("Insufficient balance to withdraw.", merchantBalance, AMOUNT_IN_WEI, ACCOUNT.address);
                    return {
                        error: "Insufficient balance to withdraw.",
                        status: false,
                        data: null,
                    };
                }
                const gas = await tokenContract.methods
                    .transfer(CHECKSUM_RECEIVER_ADDRESS, AMOUNT_IN_WEI)
                    .estimateGas({
                    from: ACCOUNT.address,
                });
                const nonce = await web3.eth.getTransactionCount(ACCOUNT.address);
                const tx = {
                    from: ACCOUNT.address,
                    to: tokenContractAddress,
                    gas,
                    gasPrice,
                    nonce,
                    data: tokenContract.methods
                        .transfer(CHECKSUM_RECEIVER_ADDRESS, AMOUNT_IN_WEI)
                        .encodeABI(),
                };
                const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
                const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
                console.log("Transaction successful: ");
                return {
                    error: null,
                    status: true,
                    data: receipt,
                };
            }
        }
    }
    catch (error) {
        console.log("Error in withdrawFund : ", error.message);
        return { error: error.message, status: false, data: null };
    }
}
//# sourceMappingURL=evm.helper.js.map