import { Wallet, ethers } from "ethers";
import { ConfigService } from "src/config/config.service";
import {
  AMOUNT_TO_APPROVE,
  BNB_CHAIN_ID,
  ETH_CHAIN_ID,
  NATIVE,
  POLYGON_CHAIN_ID,
} from "src/constants";
import { tokenABI } from "src/utils/tokenAbi.service";
import { Web3 } from "web3";

import { calculateTaxes, fromWeiCustom, toWeiCustom } from "./helper";
import Moralis from "moralis";
import { routerV2Abi } from "src/utils/routerV2Abi.service";
import { WithdrawPaymentStatus } from "src/payment-link/schema/payment.enum";

export const isValidEVMAddress = async (address) => {
  try {
    const web3 = new Web3(); // Initialize Web3 instance.
    const result = web3.utils.isAddress(address);
    return result;
  } catch (error) {
    return false;
  }
};

export const getWeb3 = async (chainId) => {
  const rpc = getNetwork(chainId).rpc;
  const web3 = new Web3(rpc);
  return web3;
};

export const getWeb3TokenContract = (chainId, tokenContractAddress) => {
  const rpc = getNetwork(chainId).rpc;
  const web3 = new Web3(rpc);
  const contract = new web3.eth.Contract(tokenABI, tokenContractAddress);
  return {
    web3,
    contract,
  };
};

export const generateEvmWallet = (mnemonic: any, index: number) => {
  let ethNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
  const account = ethNode.derivePath(`m/44'/60'/0'/0/${index}`);

  const wallet = {
    address: account.address,
    privateKey: account.privateKey,
    mnemonic: account.mnemonic,
    index: index,
  };
  return wallet;
};

export const getEvmWalletFromPrivateKey = async (
  privateKey: any,
  name: string,
  walletType: string,
  id: string
) => {
  let walletDetails: any = new Wallet(privateKey);

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

export const generateMnemonic = () => {
  const mnemonic = ethers.utils.entropyToMnemonic(ethers.utils.randomBytes(16));
  return mnemonic;
};

export async function evmCryptoBalanceCheck(
  RPC_URL,
  tokenAddress,
  walletAddress
) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

    if (tokenAddress === NATIVE) {
      const balance = await provider.getBalance(walletAddress);
      return balance;
    } else {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        tokenABI,
        provider
      );
      const balance = await tokenContract.balanceOf(walletAddress);
      return balance;
    }
  } catch (e) {
    console.error("Error in evmCryptoTransfer:", e);
  }
}

export function getNetwork(chainId) {
  switch (chainId.toString()) {
    case ETH_CHAIN_ID:
      return {
        network: "Ethereum",
        symbol: "ETH",
        rpc: ConfigService.keys.ETH_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/HZGTgTPiqB408bYkAdUFeDOTedqp4DBA",
        explorerURL: ConfigService.keys.ETH_EXPLORER_URL || "https://sepolia.etherscan.io/tx/",
        tokenType: "ERC20",
      };
    case BNB_CHAIN_ID:
      return {
        network: "BNB Smart Chain",
        symbol: "BNB",
        rpc: ConfigService.keys.BNB_RPC_URL || "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
        explorerURL: ConfigService.keys.BNB_EXPLORER_URL || "https://testnet.bscscan.com/tx/",
        tokenType: "BEP20",
      };
    case POLYGON_CHAIN_ID:
      return {
        network: "Polygon",
        symbol: "MATIC",
        rpc: ConfigService.keys.POLYGON_RPC_URL || "https://polygon-amoy.g.alchemy.com/v2/HZGTgTPiqB408bYkAdUFeDOTedqp4DBA",
        explorerURL: ConfigService.keys.POLYGON_EXPLORER_URL || "https://amoy.polygonscan.com/tx/",
      };

    // case 43113:
    //   return {
    //     network: "Avalanche-Fuji",
    //     symbol: "AVAX",
    //     rpc: "https://avax-fuji.g.alchemy.com/v2/HZGTgTPiqB408bYkAdUFeDOTedqp4DBA",
    //     explorerURL: "https://testnet.avascan.info/blockchain/pulsar/tx/",
    //   };
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

export async function getERC20TxFee(
  chainId,
  senderAddress,
  receiverAddress,
  contractAddress,
  amount,
  decimal,
  adminPaymentLinksCharges,
  adminPaymentLinksChargesWallet
) {
  try {
    let web3;
    let contract;

    const web3Token = await getWeb3TokenContract(chainId, contractAddress);
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

      adminAmount = web3.utils.toWei(
        adminAmount.toString(),
        getDecimalUnit(decimal)
      );

      adminGas = await contract.methods
        .transfer(adminPaymentLinksChargesWallet, adminAmount.toString())
        .estimateGas({
          from: senderAddress,
        });
    }

    merchantAmount = web3.utils.toWei(
      merchantAmount.toString(),
      getDecimalUnit(decimal)
    );

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
  } catch (error) {
    console.log(
      "-- *************** Error in getERC20TxFee function : ",
      error.message
    );
    return {
      adminGas: null,
      merchantGas: null,
      totalGas: null,
      gasPrice: null,
    };
  }
}

export async function evmNativeTokenTransferToPaymentLinks(
  chainId,
  nativeAmount,
  recipientAddress
) {
  let receipt = null;
  try {
    const adminWalletPrivateKey = ConfigService.keys.ADMIN_WALLET_PRIVATE_KEY;
    // console.log("adminWalletPrivateKey is : ", adminWalletPrivateKey);

    const web3 = await getWeb3(chainId);
    const account = web3.eth.accounts.privateKeyToAccount(
      adminWalletPrivateKey
    );

    web3.eth.accounts.wallet.add(account);
    const senderAddress = account.address;
    // console.log("web3 senderAddress is : ", senderAddress);

    // const AMOUNT_IN_WEI = web3.utils.toWei(amount.toString(), "ether"); // Adjust for token decimals

    // Get the current gas price
    const gasPrice = await web3.eth.getGasPrice();

    // Convert to checksum address
    const checksumAddress = web3.utils.toChecksumAddress(recipientAddress);
    // console.log("checksumAddress : ", checksumAddress);

    // Estimate gas for the transaction
    const gasLimit = await web3.eth.estimateGas({
      from: senderAddress,
      to: checksumAddress,
      value: nativeAmount,
    });

    // Create the transaction object for ETH transfer
    const tx = {
      from: senderAddress,
      to: recipientAddress,
      value: nativeAmount, // ETH in Wei
      gas: gasLimit,
      gasPrice,
    };

    // Sign the transaction with the private key
    const signedTx = await web3.eth.accounts.signTransaction(
      tx,
      adminWalletPrivateKey
    );

    // Send the signed transaction
    receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    // console.log(
    //   "Native Transaction successful with hash:",
    //   receipt.transactionHash
    // );
    return receipt;
  } catch (e) {
    console.error(
      "----- ********************* ---- Error in evmCryptoTransfer:",
      e
    );
    return receipt;
  }
}

export async function evmERC20TokenTransfer(
  chainId,
  paymentLinkPrivateKey,
  txCost,
  tokenContractAddress,
  amount,
  merchantAddress,
  decimal,
  adminPaymentLinksCharges,
  adminPaymentLinksChargesWallet
) {
  try {
    let web3 = null;
    let contract = null;
    let adminAmountInWei = null;
    let adminAmountCharge = null;

    let receipt1 = null;
    let receipt2 = null;

    const web3Token = await getWeb3TokenContract(chainId, tokenContractAddress);
    web3 = web3Token.web3;
    contract = web3Token.contract;

    const account = web3.eth.accounts.privateKeyToAccount(
      paymentLinkPrivateKey
    );

    web3.eth.accounts.wallet.add(account);
    const senderAddress = account.address;

    const AMOUNT_IN_WEI = web3.utils.toWei(
      amount.toString(),
      getDecimalUnit(decimal)
    ); // Adjust for token decimals

    let merchantRemainingAmountInWei = BigInt(AMOUNT_IN_WEI);

    // Calculate admin fee if applicable
    if (adminPaymentLinksCharges > 0) {
      // Create the transaction object
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

      // console.log("adminTx : ", adminTx);

      // Sign the transaction with the private key
      const signedTx1 = await web3.eth.accounts.signTransaction(
        adminTx,
        paymentLinkPrivateKey
      );

      // Send the transaction
      receipt1 = await web3.eth.sendSignedTransaction(signedTx1.rawTransaction);

      // console.log("ERC20 Admin Transaction hash:", receipt1.transactionHash);
    }

    // console.log(
    //   "merchantRemainingAmountInWei : ",
    //   merchantRemainingAmountInWei.toString(), // Ensure BigInt is converted to string
    //   typeof merchantRemainingAmountInWei
    // );

    // Fetch the current nonce for the sender's address
    const currentNonce = await web3.eth.getTransactionCount(
      senderAddress,
      "pending"
    );

    // Create the transaction object
    const merchantTx = {
      from: senderAddress,
      to: tokenContractAddress,
      gasPrice: txCost.gasPrice,
      gas: txCost.merchantGas, // Make sure this value is sufficient for the transaction
      nonce: currentNonce, // Use the correct nonce
      data: contract.methods
        .transfer(merchantAddress, merchantRemainingAmountInWei.toString()) // Ensure BigInt is converted to string for Web3
        .encodeABI(),
    };

    // console.log("merchantTx : ", merchantTx);

    try {
      // Sign the transaction with the private key
      let signedTx2 = await web3.eth.accounts.signTransaction(
        merchantTx,
        paymentLinkPrivateKey
      );

      // Send the transaction
      receipt2 = await web3.eth.sendSignedTransaction(signedTx2.rawTransaction);

      // console.log("ERC20 Transaction hash:", receipt2.transactionHash);
    } catch (error) {
      console.error("Transaction error:", error);
    }

    return {
      receipt1,
      receipt2,
    };
  } catch (e) {
    console.error("Error in evmERC20TokenTransfer:", e.message);
    return {
      receipt1: null,
      receipt2: null,
    };
  }
}

export async function evmNativeTokenTransferFromPaymentLinks(
  chainId,
  paymentLinkPrivateKey,
  fullAmount,
  merchantAddress,
  decimal,
  adminPaymentLinksCharges,
  adminPaymentLinksChargesWallet,
  currentWithdrawStatus
) {
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

  const web3 = await getWeb3(chainId);

  let adminReceipt = null;
  let merchantReceipt = null;

  const tax = await calculateTaxes(fullAmount, adminPaymentLinksCharges);
  console.log("Tax is : ", tax);

  let adminAmount = tax.adminAmount;
  let merchantAmount = tax.merchantAmount;

  txCost.gasPrice = Number(await web3.eth.getGasPrice());

  console.log(
    "adminAmount and merchantAmount 1 : ",
    adminAmount,
    merchantAmount
  );

  // Convert admin and merchant amounts to Wei using 'ether' as the unit (for 18 decimals)
  if (adminAmount > 0) {
    adminAmount = toWeiCustom(adminAmount, decimal);
  }

  merchantAmount = toWeiCustom(merchantAmount, decimal);

  console.log(
    "adminAmount and merchantAmount 2 : ",
    adminAmount,
    merchantAmount
  );

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

  // Calculate transaction gas for amdin and merchant
  if (adminAmount > 0) {
    txCost.adminGas = Number(await web3.eth.estimateGas(adminTxData));
  }

  const updatedMerchantValue =
    merchantAmount - txCost.adminGas * txCost.gasPrice - 10000000;
  console.log("updatedMerchantValue : ", updatedMerchantValue, txCost.adminGas);

  txCost.merchantGas = Number(await web3.eth.estimateGas({
    from: senderAddress,
    to: merchantAddress,
    value: updatedMerchantValue,
  }));

  console.log("txConst 1 : ", txCost);

  const merchantValueAfterGas =
    merchantAmount -
    100 -
    (txCost?.adminGas + txCost?.merchantGas) * txCost?.gasPrice;

  console.log(
    "ADMIn and merchant : ",
    txCost?.adminGas,
    txCost?.merchantGas,
    txCost?.gasPrice,
    merchantValueAfterGas
  );

  try {
    if (
      adminAmount > 0 &&
      currentWithdrawStatus !== WithdrawPaymentStatus.ADMIN_CHARGES
    ) {
      console.log(
        "also transfer admin fee --------------------------------------------------------"
      );

      // Create the transaction object for ETH transfer
      const adminTx = {
        ...adminTxData,
        gas: txCost.adminGas,
        gasPrice: txCost.gasPrice,
      };

      // Sign the transaction with the private key
      const signedAdminTx = await web3.eth.accounts.signTransaction(
        adminTx,
        paymentLinkPrivateKey
      );

      // Send the signed transaction
      adminReceipt = await web3.eth.sendSignedTransaction(
        signedAdminTx.rawTransaction
      );
    }

    console.log(
      "Now transfer merchant fee --------------------------------------------------"
    );

    // Fetch the current nonce for the sender's address
    const currentNonce = await web3.eth.getTransactionCount(
      senderAddress,
      "pending"
    );

    // Create the transaction object for ETH transfer
    const merchantTx = {
      ...merchantTxData,
      nonce: currentNonce, // Use the correct nonce
      gas: txCost.merchantGas,
      gasPrice: txCost.gasPrice,
      value: merchantValueAfterGas,
    };

    // Sign the transaction with the private key
    const signedMerchantTx = await web3.eth.accounts.signTransaction(
      merchantTx,
      paymentLinkPrivateKey
    );

    // Send the signed transaction
    merchantReceipt = await web3.eth.sendSignedTransaction(
      signedMerchantTx.rawTransaction
    );

    console.log("RRRRR : ", merchantValueAfterGas, adminAmount, decimal);
    console.log("--*-*-*- : ", fromWeiCustom(merchantValueAfterGas, decimal));

    return {
      adminReceipt,
      merchantReceipt,
      merchantAmount: fromWeiCustom(merchantValueAfterGas, decimal),
      adminAmount: fromWeiCustom(adminAmount, decimal),
    };
  } catch (error) {
    console.log("Error in Transaction Native token from paymentLink : ", error);
    return {
      adminReceipt,
      merchantReceipt,
    };
  }
}

export async function getERC20TransferTxFee(
  rpcURL,
  tokenContractAddress,
  tokenAmount,
  decimals,
  receiverAddress,
  senderAddress
) {
  let gasFeeInWei;
  let gasFeeInEther;
  try {
    const web3 = new Web3(rpcURL);

    // Get gas price
    const gasPrice = await web3.eth.getGasPrice();

    const tokenContract = new web3.eth.Contract(tokenABI, tokenContractAddress);

    const tokenAmountInWei = web3.utils.toWei(tokenAmount, decimals);

    const gasEstimate = await tokenContract.methods
      .transfer(receiverAddress, tokenAmountInWei)
      .estimateGas({
        from: senderAddress,
      });

    // Calculate gas fee
    gasFeeInWei = gasEstimate * gasPrice;
    gasFeeInEther = web3.utils.fromWei(gasFeeInWei.toString(), "ether");
  } catch (e) {
    console.error("Error in transaction fee estimation:", e);
  } finally {
    return {
      gasFeeInWei,
      gasFeeInEther,
    };
  }
}

export async function deposit_bnb_for_gas_fee(
  chainId,
  privateKey,
  tokenContractAddress,
  receiverAddress,
  tokenAmount,
  paymentLinkAddress
) {
  // deposit gas fee amount for withdraw 5 USDT from wallet address
  try {
    const network = getNetwork(chainId);
    const web3 = new Web3(network?.rpc);

    // Create wallet from private key
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);

    const tokenContract = new web3.eth.Contract(tokenABI, tokenContractAddress);

    const tokenDecimals = Number(await tokenContract.methods.decimals().call());

    // get the transfer fee
    const gasFee = await getERC20TransferTxFee(
      network?.rpc,
      tokenContractAddress,
      tokenAmount,
      tokenDecimals,
      receiverAddress,
      account.address
    );

    const nonce = await web3.eth.getTransactionCount(account.address);

    // Fetch current gas price
    const gasPrice = await web3.eth.getGasPrice();

    // Set gas limit (you can adjust this if needed)
    const gasLimit = 21000; // Adjust if needed based on the transaction

    // Create a transaction object
    const tx = {
      from: account.address,
      to: paymentLinkAddress,
      nonce: nonce,
      value: gasFee.gasFeeInWei, // Amount of BNB you want to send
      gas: gasLimit,
      gasPrice: gasPrice, // Use the fetched gas price
    };

    // Sign the transaction with the private key
    const signTx = await web3.eth.accounts.signTransaction(tx, privateKey);

    // Send the signed transaction
    const receipt = await web3.eth.sendSignedTransaction(signTx.rawTransaction);

    return receipt;
  } catch (error) {
    console.log("Error in deposit_bnb_for_gas_fee : ", error);
  }
}

export async function withdrawEvmFund(
  chainId,
  privateKey,
  tokenContractAddress,
  Amount,
  receiverAddress
) {
  try {
    const network = getNetwork(chainId);
    const web3 = new Web3(network?.rpc);

    // Create wallet from private key
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);

    // Fetch current gas price
    const gasPrice = await web3.eth.getGasPrice();

    const nonce = await web3.eth.getTransactionCount(account.address);

    if (tokenContractAddress === NATIVE) {
      // Native token transfer

      // Fetch current gas price
      const gasPrice = await web3.eth.getGasPrice();

      // console.log("receipt : ", receipt);
    } else {
      // ERC20 token transfer
      const tokenContract = new web3.eth.Contract(
        tokenABI,
        tokenContractAddress
      );

      const tokenDecimals = Number(
        await tokenContract.methods.decimals().call()
      );

      // Calculate the amount based on the token decimals
      const amountInWei = toWeiCustom(Amount, tokenDecimals);

      const gas = await tokenContract.methods
        .transfer(receiverAddress, amountInWei)
        .estimateGas({
          from: account.address,
        });

      // Create transaction data for token transfer
      const tx = {
        from: account.address,
        to: tokenContractAddress,
        gas, // You can adjust gas limit as needed
        gasPrice,
        nonce,
        data: tokenContract.methods
          .transfer(receiverAddress, amountInWei)
          .encodeABI(),
      };

      // Sign the transaction
      const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

      // Send the signed transaction
      const receipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );

      return receipt;
    }

    // return receipt;
  } catch (error) {
    console.log("Error in withdrawFund : ", error.message);
    return { error: error.message };
  }
}

export async function getEVMNativeBalance(walletAddress: string[]) {
  let balances = {
    bsc: 0,
    eth: 0,
    matic: 0,
    avax: 0,
  };
  try {
    const bscResponse =
      await Moralis.EvmApi.balance.getNativeBalancesForAddresses({
        chain: ConfigService.keys.MORALIS_BSC_CHAIN || "0x61",
        walletAddresses: walletAddress,
      });

    balances.bsc = Number(
      await bscResponse.toJSON()[0].total_balance_formatted
    );

    const ethResponse =
      await Moralis.EvmApi.balance.getNativeBalancesForAddresses({
        chain: ConfigService.keys.MORALIS_ETH_CHAIN || "0xaa36a7",
        walletAddresses: walletAddress,
      });
    balances.eth = Number(
      await ethResponse.toJSON()[0].total_balance_formatted
    );

    const maticResponse =
      await Moralis.EvmApi.balance.getNativeBalancesForAddresses({
        chain: ConfigService.keys.MORALIS_POLYGON_CHAIN || "0x13882",
        walletAddresses: walletAddress,
      });
    balances.matic = Number(
      await maticResponse.toJSON()[0].total_balance_formatted
    );

    const avaxResponse =
      await Moralis.EvmApi.balance.getNativeBalancesForAddresses({
        chain: "0xa86a",
        walletAddresses: walletAddress,
      });
    balances.avax = Number(
      await avaxResponse.toJSON()[0].total_balance_formatted
    );
  } catch (error) {
    console.log("Error getting native balances : ", error.message);
  } finally {
    return balances;
  }
}

const getSwapContractAddresses = (chainId) => {
  switch (chainId.toString()) {
    case ETH_CHAIN_ID:
      return {
        router: "",
        factory: "",
      };
    case POLYGON_CHAIN_ID:
      return {
        router: "",
        factory: "",
      };
    case BNB_CHAIN_ID:
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

export async function merchantEvmFundWithdraw(
  chainId,
  privateKey,
  tokenContractAddress,
  Amount,
  receiverAddress,
  decimal,
  swapTokenAddress
) {
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
    const web3 = new Web3(network?.rpc);

    // Create wallet from private key
    const ACCOUNT = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(ACCOUNT);

    // Fetch current gas price
    const gasPrice = await web3.eth.getGasPrice();

    const CHECKSUM_RECEIVER_ADDRESS =
      web3.utils.toChecksumAddress(receiverAddress);

    const AMOUNT_IN_WEI = web3.utils.toWei(
      Amount.toString(),
      getDecimalUnit(decimal)
    );

    // Check if the account has enough balance
    const NATIVE_BALANCE = await web3.eth.getBalance(ACCOUNT.address);

    const EXPIRE_TIME = Math.floor(Date.now() / 1000) + 60 * 10;

    if (swapTokenAddress) {
      let path = [tokenContractAddress, swapTokenAddress];
      const isNativeSwap =
        path[0].toLowerCase() === NATIVE.toLowerCase() ||
        path[1].toLowerCase() === NATIVE.toLowerCase();

      const Tokens = getSwapContractAddresses(chainId);
      const tokenContract = new web3.eth.Contract(tokenABI, path[0]);
      const approvedAmount = await tokenContract.methods
        .allowance(ACCOUNT.address, Tokens.router)
        .call();

      // Need to approve the contract address
      if (BigInt(String(approvedAmount)) < BigInt(AMOUNT_IN_WEI)) {
        const gas = await tokenContract.methods
          .approve(Tokens.router, AMOUNT_TO_APPROVE)
          .estimateGas({
            from: ACCOUNT.address,
          });

        // Approve the router to spend the tokens
        const approveTx = tokenContract.methods
          .approve(Tokens.router, AMOUNT_TO_APPROVE)
          .send({ from: ACCOUNT.address, gas: gas.toString(), gasPrice: gasPrice.toString() });

        const receipt = await approveTx;

        console.log("Transaction approved successfully!");
      } else {
        console.log("Don't need to approve the contract address");
      }

      const swapContract = new web3.eth.Contract(routerV2Abi, Tokens.router);
      if (!isNativeSwap) {
        const nonce = await web3.eth.getTransactionCount(ACCOUNT.address);

        const gas = await swapContract.methods
          .swapExactTokensForTokens(
            AMOUNT_IN_WEI,
            0,
            path,
            receiverAddress,
            EXPIRE_TIME
          )
          .estimateGas({
            from: ACCOUNT.address,
          });

        // Swap Token to Token
        const receipt = await swapContract.methods
          .swapExactTokensForTokens(
            AMOUNT_IN_WEI,
            0,
            path,
            receiverAddress,
            EXPIRE_TIME
          )
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
      } else {
        const nonce = await web3.eth.getTransactionCount(ACCOUNT.address);

        const gas = await tokenContract.methods
          .swapExactTokensForETH(
            AMOUNT_IN_WEI,
            path,
            receiverAddress,
            EXPIRE_TIME
          )
          .estimateGas({
            from: ACCOUNT.address,
          });

        // Swap Token to Native
        const receipt = await swapContract.methods
          .swapExactTokensForETH(
            AMOUNT_IN_WEI,
            path,
            receiverAddress,
            EXPIRE_TIME
          )
          .send({
            from: ACCOUNT.address,
            gas: gas.toString(),
            gasPrice: gasPrice.toString(),
            nonce: nonce.toString(),
          });

        // const swapReceipt = await txSwap;
        console.log("Swap Token 2 Native transaction confirmed:");

        return {
          error: null,
          status: true,
          data: receipt,
        };
      }
    } else {
      if (tokenContractAddress === NATIVE) {
        // Native token transfer

        if (BigInt(NATIVE_BALANCE) < BigInt(AMOUNT_IN_WEI)) {
          console.log("Insufficient balance to withdraw.");
          return {
            error: "Insufficient balance to withdraw.",
            status: false,
            data: null,
          };
        }

        // Estimate gas for the transaction
        const gasLimit = await web3.eth.estimateGas({
          from: ACCOUNT.address,
          to: CHECKSUM_RECEIVER_ADDRESS,
          value: AMOUNT_IN_WEI,
        });

        const nonce = await web3.eth.getTransactionCount(ACCOUNT.address);

        // Create the transaction object for ETH transfer
        const tx = {
          from: ACCOUNT.address,
          to: CHECKSUM_RECEIVER_ADDRESS,
          value: AMOUNT_IN_WEI, // ETH in Wei
          nonce,
          gas: gasLimit,
          gasPrice,
        };

        // Sign the transaction with the private key
        const signedTx = await web3.eth.accounts.signTransaction(
          tx,
          privateKey
        );

        // Send the signed transaction
        const receipt = await web3.eth.sendSignedTransaction(
          signedTx.rawTransaction
        );
        console.log("Transaction successful: ");
        return {
          error: null,
          status: true,
          data: receipt,
        };
      } else {
        // ERC20 token transfer
        const tokenContract = new web3.eth.Contract(
          tokenABI,
          tokenContractAddress
        );

        const merchantBalance = await tokenContract.methods
          .balanceOf(ACCOUNT.address)
          .call({
            from: ACCOUNT.address,
          });

        if (BigInt(String(merchantBalance)) < BigInt(AMOUNT_IN_WEI)) {
          console.log(
            "Insufficient balance to withdraw.",
            merchantBalance,
            AMOUNT_IN_WEI,
            ACCOUNT.address
          );
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

        // Create transaction data for token transfer
        const tx = {
          from: ACCOUNT.address,
          to: tokenContractAddress,
          gas, // You can adjust gas limit as needed
          gasPrice,
          nonce,
          data: tokenContract.methods
            .transfer(CHECKSUM_RECEIVER_ADDRESS, AMOUNT_IN_WEI)
            .encodeABI(),
        };

        // Sign the transaction
        const signedTx = await web3.eth.accounts.signTransaction(
          tx,
          privateKey
        );

        // Send the signed transaction
        const receipt = await web3.eth.sendSignedTransaction(
          signedTx.rawTransaction
        );
        console.log("Transaction successful: ");

        return {
          error: null,
          status: true,
          data: receipt,
        };
      }
    }

    // return receipt;
  } catch (error) {
    console.log("Error in withdrawFund : ", error.message);
    return { error: error.message, status: false, data: null };
  }
}
