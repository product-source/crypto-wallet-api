import BIP32Factory from "bip32";
import { TronWeb, utils as TronWebUtils } from "tronweb";
import * as ecc from "tiny-secp256k1";
import * as bip39 from "bip39";
import bs58 from "bs58";
import * as crypto from "crypto";
import axios from "axios";
import { NATIVE } from "src/constants";
import { ConfigService } from "src/config/config.service";
import { fromWeiCustom, toWeiCustom } from "./helper";
// import tron from '@api/tron';

// export const TronAdminAddress = "TRVdq9hmVLP8NLM4VZEXeTxGcP1kBgjwF5"

// export const NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const tronDecimal = 10 ** 6;

const fullHost = ConfigService.keys.TRON_NODE || "https://api.shasta.trongrid.io";
// const fullHost = "https://api.trongrid.io";
const tronWeb = new TronWeb({
  fullHost: fullHost,
  headers: { "TRON-PRO-API-KEY": ConfigService.keys.TRON_GRID_API_KEY || "8d831a3d-aba9-40b7-9e4b-c5ba2a6b77da" },
});

export const getTronNativeBalance = async (addresses: string[]) => {
  try {
    // Fetch and sum balances in parallel, then convert from sun to trx
    const tronBalance = await Promise.all(
      addresses.map(async (address) => {
        const balance = await tronWeb.trx.getBalance(address);
        return balance / 10 ** 6; // Convert from sun to trx
      })
    ).then((balances) =>
      balances.reduce((total, currentBalance) => total + currentBalance, 0)
    );

    return tronBalance ? Number(tronBalance) : 0;
  } catch (error) {
    console.log("Error in get tron balance : ", error.message);
    return 0; // return 0 if there's an error
  }
};

export const generateTronWallet = (mnemonic: any, index: number) => {
  const bip32 = BIP32Factory(ecc);
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const node = bip32.fromSeed(seed);

  // Choose a derivation path
  const path = `m/44'/195'/0'/0/${index}`;

  // Derive the key pair using the chosen path
  const child = node.derivePath(path);
  const privateKey = child?.privateKey?.toString("hex");
  // const publicKey = TronWeb.address.fromPrivateKey(privateKey);
  const address = TronWeb.address.fromPrivateKey(privateKey);

  const wallet = {
    address: address,
    privateKey: privateKey,
    mnemonic: mnemonic,
    path: path,
    index: index,
  };
  return wallet;
};

export const getTronBalance = async (address) => {
  const balance = await tronWeb.trx.getBalance(address);

  return balance / 10 ** 6;
};

export const getTRC20Balance = async (tokens: any[], privateKey: string) => {
  console.log("get TRC20 Balance called ----------------");

  try {
    const tronWeb = new TronWeb({
      fullHost: fullHost, // Ensure this is defined
      privateKey: privateKey,
    });

    const userAddress = TronWeb.address.fromPrivateKey(privateKey);

    // Use Promise.all to wait for all contract calls
    let updatedTokens = await Promise.all(
      tokens.map(async (token) => {
        const tokenAddress = token.address || token.tokenAddress;
        const contract = await tronWeb.contract().at(tokenAddress); // Use token's address field

        const balance = Number(await contract.balanceOf(userAddress).call());
        const decimal = Number(await contract.decimals().call());

        // Return the original token data + the appended balance and address
        return {
          ...token?._doc, // Spread the original token data
          token_address: tokenAddress, // Use the token's address
          balance: fromWeiCustom(balance, decimal), // Normalize the balance
          decimal: decimal,
        };
      })
    );

    // Return the updated token list with appended data
    return updatedTokens;
  } catch (error) {
    console.error("Error fetching token details:", error);
    return [];
  }
};

export function hexToTronAddress(hexString) {
  // Remove the '0x' prefix if present
  if (hexString.startsWith("0x") || hexString.startsWith("0X")) {
    hexString = hexString.subarray(2);
  }

  // Add the '41' prefix for Tron addresses
  const tronHexString = "41" + hexString;

  // Convert to Buffer
  const bytes = Buffer.from(tronHexString, "hex");

  // Generate checksum by hashing twice with SHA-256
  const hash1 = crypto.createHash("sha256").update(bytes).digest();
  const hash2 = crypto.createHash("sha256").update(hash1).digest();
  const checksum = hash2.subarray(0, 4);

  // Append checksum to the bytes
  const addressWithChecksum = Buffer.concat([bytes, checksum]);

  // Encode to Base58
  const tronAddress = bs58.encode(addressWithChecksum);

  return tronAddress;
}

export const getTronTransactions = async (address) => {
  try {
    if (address) {
      const response = await axios.get(
        `${fullHost}/v1/accounts/${address}/transactions`
      );
      return response;
    }
  } catch (error) {
    console.error("Error while getting Tron transactions:", error.message);
    throw error;
  }
};

export const estimateTrxForTrc20Transfer = async (
  fromAddress,
  toAddress,
  amount
) => {
  try {
    // Parameters for the TRC20 transfer
    const functionSelector = "transfer(address,uint256)";
    const parameter = [
      { type: "address", value: toAddress },
      { type: "uint256", value: tronWeb.toSun(amount) },
    ];

    // Estimate the energy cost
    const energyNeeded = 80000; // Average energy needed for TRC20 transfer
    const trxPerEnergy = 0.000071; // Approx TRX per energy unit
    const energyCost = energyNeeded * trxPerEnergy;

    // Get available bandwidth points
    const bandwidth = await tronWeb.trx.getBandwidth(fromAddress);
    const bandwidthNeeded = 250; // Typical bandwidth needed for transaction

    const bandwidthCost =
      bandwidth < bandwidthNeeded ? (bandwidthNeeded - bandwidth) / 1000 : 0;

    const totalTrxRequired = energyCost + bandwidthCost;

    console.log(
      `Estimated TRX required for the transfer: ${totalTrxRequired.toFixed(2)} TRX`
    );
    return totalTrxRequired;
  } catch (error) {
    console.error("Error estimating TRX required:", error);
    throw error;
  }
};

export const getTRC20Transactions = async (address) => {
  try {
    if (address) {
      const response = await axios.get(
        `${fullHost}/v1/accounts/${address}/transactions/trc20`
      );
      return response;
    }
  } catch (error) {
    console.error("Error while getting Tron transactions:", error.message);
    throw error;
  }
};

export const transferTron = async (
  privateKey: string,
  tokenContractAddress: string,
  receiverAddress: string,
  amount: number, // in TRX,
  decimal: number
) => {
  try {
    // Convert amount from TRX to sun (1 TRX = 1e6 sun)
    // const amountInSun = tronWeb.toSun(amount);
    const userAddress = await TronWeb.address.fromPrivateKey(privateKey);

    if (tokenContractAddress === NATIVE) {
      // Create an unsigned transaction
      const transaction = await tronWeb.transactionBuilder.sendTrx(
        receiverAddress,
        amount * 10 ** decimal,
        userAddress || ""
      );

      // Sign the transaction using the private key
      const signedTransaction = await tronWeb.trx.sign(transaction, privateKey);

      // Broadcast the transaction to the network
      const receipt = await tronWeb.trx.sendRawTransaction(signedTransaction);

      console.log("Transaction successful, receipt:");
      return receipt;
    } else {
      const tronWeb = new TronWeb({
        fullHost: fullHost, // Ensure this is defined
        privateKey: privateKey,
      });

      // Get the contract instance
      const contract = await tronWeb.contract().at(tokenContractAddress);

      // Execute the transfer method (this is an async call)
      const txid = await contract.methods
        .transfer(receiverAddress, amount * 10 ** decimal)
        .send({
          from: userAddress,
          feeLimit: 4000000000, // Adjust the fee limit as needed
        });

      console.log("Transaction successful! TRC-20 TxID:", txid);
      return txid;
    }
  } catch (error) {
    console.error("Error while transferring TRC20:", error.message);
    throw error;
  }
};

export const isValidTronAddress = (address: string) => {
  const result = TronWeb.isAddress(address);
  return result;
};

export const merchantTronFundWithdraw = async (
  privateKey: string,
  tokenContractAddress: string,
  amount: string, // in TRX,
  receiverAddress: string,
  decimal: number
) => {
  try {
    // Convert amount from TRX to sun (1 TRX = 1e6 sun)
    const userAddress = await TronWeb.address.fromPrivateKey(privateKey);

    const tronWeb = new TronWeb({
      fullHost: fullHost, // Ensure this is defined
      privateKey: privateKey,
    });

    if (!userAddress) {
      throw new Error("Invalid private key");
    }

    const TRON_BALANCE = await tronWeb.trx.getBalance(userAddress);
    const AMOUNT_IN_WEI = toWeiCustom(amount, decimal);

    if (tokenContractAddress === NATIVE) {
      if (BigInt(TRON_BALANCE) < BigInt(AMOUNT_IN_WEI)) {
        return {
          status: false,
          error: "Insufficient TRX balance",
          data: null,
        };
      }
      // Create an unsigned transaction
      const transaction = await tronWeb.transactionBuilder.sendTrx(
        receiverAddress,
        AMOUNT_IN_WEI,
        userAddress
      );

      // Sign the transaction using the private key
      const signedTransaction = await tronWeb.trx.sign(transaction, privateKey);

      // Broadcast the transaction to the network
      const receipt = await tronWeb.trx.sendRawTransaction(signedTransaction);

      console.log("Transaction successful, receipt:");

      if (receipt?.result) {
        // Send the transaction
        return {
          error: null,
          status: true,
          data: {
            transactionHash: receipt?.transaction?.txID,
            gasUsed: 0,
            effectiveGasPrice: 0,
            blockNumber: 0,
          },
        };
      } else {
        return {
          error: "Transaction Failed",
          status: false,
          data: null,
        };
      }
    } else {
      // Get the contract instance
      const contract = await tronWeb.contract().at(tokenContractAddress);

      const TOKEN_BALANCE = await contract.balanceOf(userAddress).call();

      if (BigInt(TOKEN_BALANCE) < BigInt(AMOUNT_IN_WEI)) {
        return {
          status: false,
          error: "Insufficient token balance",
          data: null,
        };
      }

      // Execute the transfer method (this is an async call)
      const receipt = await contract.methods
        .transfer(receiverAddress, AMOUNT_IN_WEI)
        .send({
          from: userAddress,
          feeLimit: 15000000,
        });

      console.log("Transaction successful! TRC-20 TxID:");
      if (receipt) {
        // Send the transaction
        return {
          error: null,
          status: true,
          data: {
            transactionHash: receipt,
            gasUsed: 0,
            effectiveGasPrice: 0,
            blockNumber: 0,
          },
        };
      } else {
        return {
          error: "Transaction Failed",
          status: false,
          data: null,
        };
      }
    }
  } catch (error) {
    console.error("Error while transferring TRC20:", error.message);
    throw error;
  }
};

export const getTronToAddressAllTransactions = async (address) => {
  const last100Transactions = 100;
  const url = `${fullHost}/v1/accounts/${address}/transactions?only_to=true&limit=${last100Transactions}&search_internal=true`;

  const headers = {
    accept: "application/json",
  };

  try {
    const response = await axios.get(url, { headers });

    return response?.data; // Return the actual data
  } catch (error) {
    console.error("Error fetching data:", error.message);
    throw new Error(error.message); // Throw the error for the caller to handle
  }
};

export const getTronTokenBalance = async (
  address,
  tokenAddress,
  privateKey
) => {
  let ethBalanceEther;
  let tokenBalanceEther;
  try {
    console.log("Fetching Tron Token Balance:", {
      address: address,
      tokenAddress: tokenAddress,
    });

    if (!privateKey) {
      throw new Error("Private key is missing in environment variables.");
    }

    const tronWeb = new TronWeb({
      fullHost: fullHost, // Ensure this is defined
      privateKey: privateKey,
    });

    // Fetch balance of native TRX
    const balanceInSun = await tronWeb.trx.getBalance(address); // Balance in Sun (smallest TRX unit)
    ethBalanceEther = tronWeb.fromSun(balanceInSun); // Convert to TRX

    if (tokenAddress === NATIVE) {
      return {
        ethBalanceEther,
        tokenBalanceEther,
      };
    }
    console.log("More than native TRX balance available");

    // Fetch TRC20 token balance
    const contract = await tronWeb.contract().at(tokenAddress);

    // Ensure the address provided is valid
    if (!TronWeb.isAddress(address)) {
      throw new Error("Invalid Tron address.");
    }

    const balance = await contract.methods.balanceOf(address).call();
    const decimals = await contract.methods.decimals().call(); // Fetch decimals of the token
    tokenBalanceEther = Number(balance) / Math.pow(10, Number(decimals)); // Convert to token units

    console.log("TRC20 Token Balance:", tokenBalanceEther);
  } catch (error) {
    console.error("Error fetching Tron token balance:", error);
  } finally {
    return {
      ethBalanceEther,
      tokenBalanceEther,
    };
  }
};
