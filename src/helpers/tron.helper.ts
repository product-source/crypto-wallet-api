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
const tronHeaders = { "TRON-PRO-API-KEY": ConfigService.keys.TRON_GRID_API_KEY || "8d831a3d-aba9-40b7-9e4b-c5ba2a6b77da" };

const tronWeb = new TronWeb({
  fullHost: fullHost,
  headers: tronHeaders,
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
      headers: tronHeaders,
      privateKey: privateKey,
    });

    const userAddress = TronWeb.address.fromPrivateKey(privateKey);

    // Fetch balances sequentially to avoid 429 errors from TronGrid when many tokens are queried
    let updatedTokens = [];
    for (const token of tokens) {
      const tokenAddress = token.address || token.tokenAddress;
      const contract = await tronWeb.contract().at(tokenAddress); // Use token's address field

      const balance = Number(await contract.balanceOf(userAddress).call());
      const decimal = Number(await contract.decimals().call());

      // Return the original token data + the appended balance and address
      updatedTokens.push({
        ...token?._doc, // Spread the original token data
        token_address: tokenAddress, // Use the token's address
        balance: fromWeiCustom(balance, decimal), // Normalize the balance
        decimal: decimal,
      });

      // Add a tiny 100ms delay to smooth API request intervals
      await new Promise(resolve => setTimeout(resolve, 100));
    }

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
        `${fullHost}/v1/accounts/${address}/transactions`,
        { headers: tronHeaders }
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
        `${fullHost}/v1/accounts/${address}/transactions/trc20`,
        { headers: tronHeaders }
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
    // Validate inputs to prevent NaN errors
    if (isNaN(amount) || isNaN(decimal) || amount <= 0) {
      throw new Error(
        `Invalid transfer params: amount=${amount}, decimal=${decimal}`
      );
    }

    // Use string-based conversion to avoid floating-point precision issues
    // (ethers v6 inside TronWeb v6 rejects NaN and non-integer uint256 values)
    const amountInSmallestUnit = toWeiCustom(amount.toString(), decimal);

    console.log("[transferTron] Params:", {
      tokenContractAddress,
      receiverAddress,
      amount,
      decimal,
      amountInSmallestUnit,
    });

    const userAddress = await TronWeb.address.fromPrivateKey(privateKey);

    if (tokenContractAddress === NATIVE) {
      // Create an unsigned transaction
      const transaction = await tronWeb.transactionBuilder.sendTrx(
        receiverAddress,
        Number(amountInSmallestUnit),
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
        headers: tronHeaders,
        privateKey: privateKey,
      });

      // Get the contract instance
      const contract = await tronWeb.contract().at(tokenContractAddress);

      // Execute the transfer method (this is an async call)
      const txid = await contract.methods
        .transfer(receiverAddress, amountInSmallestUnit)
        .send({
          from: userAddress,
          feeLimit: 150000000, // 150 TRX fee limit (sufficient for USDT transfers)
        });

      console.log("TRC-20 TX broadcast, TxID:", txid);

      // Verify on-chain result — a txid does NOT guarantee success
      // (e.g. OUT_OF_ENERGY returns a txid but the transfer fails)
      const verifyResult = await verifyTronTransaction(txid);
      if (verifyResult.status === 'success') {
        console.log("Transaction verified successful! TRC-20 TxID:", txid);
      } else if (verifyResult.status === 'timeout') {
        // TX was broadcast but we couldn't confirm in time → return txid
        // to prevent double-spend. The TX may still succeed on-chain.
        console.warn(
          `[transferTron] ⚠️ TX ${txid} verification timed out. ` +
          `TX was broadcast — treating as success to prevent double-spend. ` +
          `Check: https://tronscan.org/#/transaction/${txid}`
        );
      } else {
        // status === 'failed' → TX was confirmed REVERT/OUT_OF_ENERGY on-chain
        // This is a genuinely failed transfer — throw so the cron can retry
        throw new Error(
          `TRC-20 TX ${txid} FAILED on-chain (${verifyResult.receipt}). ` +
          `Check: https://tronscan.org/#/transaction/${txid}`
        );
      }
      return txid;
    }
  } catch (error) {
    console.error("Error while transferring TRC20:", error.message);
    throw error;
  }
};

/**
 * Verify a TRON transaction succeeded on-chain.
 * TRC-20 transfers can return a txid but fail (e.g. OUT_OF_ENERGY).
 * This polls the chain to check the actual receipt status.
 *
 * Returns:
 *  - { status: 'success' }  → confirmed SUCCESS on-chain
 *  - { status: 'failed', receipt }  → confirmed REVERT / OUT_OF_ENERGY on-chain
 *  - { status: 'timeout' } → could not confirm within retries (may still succeed later)
 */
export const verifyTronTransaction = async (
  txid: string,
  maxRetries = 20,
  delayMs = 5000
): Promise<{ status: 'success' | 'failed' | 'timeout'; receipt?: string }> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      const txInfo = await tronWeb.trx.getTransactionInfo(txid);

      if (!txInfo || !txInfo.id) {
        console.log(`[verifyTronTx] Attempt ${attempt}/${maxRetries}: TX ${txid} not confirmed yet, retrying...`);
        continue;
      }

      // Check receipt status: 'SUCCESS' means the contract execution succeeded
      const receiptResult = txInfo?.receipt?.result;
      if (receiptResult === 'SUCCESS') {
        console.log(`[verifyTronTx] ✅ TX ${txid} confirmed SUCCESS on-chain`);
        return { status: 'success' };
      } else {
        console.error(
          `[verifyTronTx] ❌ TX ${txid} FAILED on-chain. Receipt: ${receiptResult || 'UNKNOWN'}`,
          `Energy used: ${txInfo?.receipt?.energy_usage_total || 0}`,
          `Fee: ${txInfo?.fee || 0} sun`
        );
        return { status: 'failed', receipt: receiptResult || 'UNKNOWN' };
      }
    } catch (error) {
      console.log(`[verifyTronTx] Attempt ${attempt}/${maxRetries}: Error checking TX ${txid}: ${error.message}`);
      if (attempt === maxRetries) {
        console.error(`[verifyTronTx] ❌ Could not verify TX ${txid} after ${maxRetries} attempts`);
        return { status: 'timeout' };
      }
    }
  }
  return { status: 'timeout' };
};

/**
 * Dynamically estimate TRX needed for a TRC-20 transfer and fund the
 * sender wallet from the admin wallet if its balance is insufficient.
 *
 * Instead of sending a fixed TRX amount, this:
 * 1. Estimates energy via triggerConstantContract
 * 2. Converts energy cost to TRX using current chain parameters
 * 3. Checks the sender's current TRX balance
 * 4. Only sends the deficit (+ buffer) from the admin/funding wallet
 *
 * Returns the post-funding TRX balance of the sender wallet (in TRX).
 */
export const estimateAndFundTrc20Gas = async (
  senderAddress: string,
  tokenContractAddress: string,
  receiverAddress: string,
  amountInSmallestUnit: string,
  adminPrivateKey: string,
): Promise<{ funded: boolean; balance: number; trxNeeded: number }> => {
  const MIN_BUFFER_TRX = 10; // extra TRX buffer on top of estimate

  try {
    // 1. Estimate energy needed for this specific TRC-20 transfer
    let estimatedEnergy = 65000; // safe default for USDT if estimation fails

    try {
      const functionSelector = "transfer(address,uint256)";
      const parameter = [
        { type: "address", value: receiverAddress },
        { type: "uint256", value: amountInSmallestUnit },
      ];

      const result = await tronWeb.transactionBuilder.triggerConstantContract(
        tokenContractAddress,
        functionSelector,
        {},
        parameter,
        senderAddress
      );

      if (result?.energy_used) {
        // Add 20% safety margin to the estimated energy
        estimatedEnergy = Math.ceil(Number(result.energy_used) * 1.2);
      }
      // Enforce minimum energy floor — estimateenergy can return inaccurately low
      // values on testnet or for certain token contracts
      const MIN_ENERGY_FLOOR = 65000;
      if (estimatedEnergy < MIN_ENERGY_FLOOR) {
        console.log(`[TRC20 Gas] Estimated energy ${estimatedEnergy} below floor ${MIN_ENERGY_FLOOR}, using floor.`);
        estimatedEnergy = MIN_ENERGY_FLOOR;
      }
      console.log(`[TRC20 Gas] Estimated energy for transfer: ${estimatedEnergy} (raw: ${result?.energy_used || 'N/A'})`);
    } catch (estError) {
      console.warn(`[TRC20 Gas] Energy estimation failed, using default ${estimatedEnergy}:`, estError.message);
    }

    // 2. Get current energy price from chain parameters
    let energyPriceSun = 420; // default ~420 sun per energy unit
    try {
      const chainParams = await tronWeb.trx.getChainParameters();
      const energyFeeParam = chainParams.find((p: any) => p.key === "getEnergyFee");
      if (energyFeeParam) {
        energyPriceSun = Number(energyFeeParam.value);
      }
      console.log(`[TRC20 Gas] Current energy price: ${energyPriceSun} sun/unit`);
    } catch (paramError) {
      console.warn(`[TRC20 Gas] Could not fetch chain params, using default energy price ${energyPriceSun}:`, paramError.message);
    }

    // 3. Calculate TRX needed: energy cost + bandwidth cost + buffer
    const energyCostTrx = (estimatedEnergy * energyPriceSun) / 1_000_000;
    const bandwidthCostTrx = 0.5; // ~345 bytes bandwidth, small cost
    const trxNeeded = Math.ceil(energyCostTrx + bandwidthCostTrx + MIN_BUFFER_TRX);

    console.log(`[TRC20 Gas] TRX needed: ${trxNeeded} (energy: ${energyCostTrx.toFixed(2)}, bandwidth: ${bandwidthCostTrx}, buffer: ${MIN_BUFFER_TRX})`);

    // 4. Check current TRX balance
    const currentBalanceSun = await tronWeb.trx.getBalance(senderAddress);
    const currentBalanceTrx = currentBalanceSun / 1_000_000;

    console.log(`[TRC20 Gas] Sender ${senderAddress} current balance: ${currentBalanceTrx} TRX, needs: ${trxNeeded} TRX`);

    // 5. If balance is already sufficient, skip funding
    if (currentBalanceTrx >= trxNeeded) {
      console.log(`[TRC20 Gas] ✅ Balance sufficient (${currentBalanceTrx} >= ${trxNeeded}). No funding needed.`);
      return { funded: true, balance: currentBalanceTrx, trxNeeded };
    }

    // 6. Calculate deficit and fund from admin wallet
    const deficit = trxNeeded - currentBalanceTrx;
    const fundAmountTrx = Math.ceil(deficit + 1); // round up + 1 TRX extra safety
    const fundAmountSun = fundAmountTrx * 1_000_000;

    console.log(`[TRC20 Gas] 💰 Funding ${fundAmountTrx} TRX (deficit: ${deficit.toFixed(2)}) from admin wallet...`);

    if (!adminPrivateKey) {
      console.error("[TRC20 Gas] ❌ No admin private key provided. Cannot fund gas.");
      return { funded: false, balance: currentBalanceTrx, trxNeeded };
    }

    const adminAddress = TronWeb.address.fromPrivateKey(adminPrivateKey) as string;
    const adminTronWeb = new TronWeb({
      fullHost: fullHost,
      headers: tronHeaders,
      privateKey: adminPrivateKey,
    });

    const transaction = await adminTronWeb.transactionBuilder.sendTrx(
      senderAddress,
      fundAmountSun,
      adminAddress
    );
    const signedTx = await adminTronWeb.trx.sign(transaction, adminPrivateKey);
    const receipt = await adminTronWeb.trx.sendRawTransaction(signedTx);

    if (receipt?.result) {
      console.log(`[TRC20 Gas] ✅ Funded ${fundAmountTrx} TRX to ${senderAddress} | TX: ${receipt?.transaction?.txID}`);

      // Wait for the funding TX to confirm (TRON blocks ~3s, need 2-4 blocks)
      await new Promise((resolve) => setTimeout(resolve, 12000));

      // Re-check balance
      const newBalanceSun = await tronWeb.trx.getBalance(senderAddress);
      const newBalanceTrx = newBalanceSun / 1_000_000;
      console.log(`[TRC20 Gas] Post-funding balance: ${newBalanceTrx} TRX`);

      return { funded: true, balance: newBalanceTrx, trxNeeded };
    } else {
      console.error("[TRC20 Gas] ❌ Funding TX failed:", receipt);
      return { funded: false, balance: currentBalanceTrx, trxNeeded };
    }
  } catch (error) {
    console.error("[TRC20 Gas] ❌ Error in estimateAndFundTrc20Gas:", error.message);
    return { funded: false, balance: 0, trxNeeded: 0 };
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
      headers: tronHeaders,
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

      // ── Dynamic Auto-Gas-Funding: estimate energy, check balance, fund deficit ──
      const adminPvtKey = ConfigService.keys.TRON_ADMIN_PRIVATE_KEY;
      if (adminPvtKey) {
        const gasResult = await estimateAndFundTrc20Gas(
          userAddress,
          tokenContractAddress,
          receiverAddress,
          AMOUNT_IN_WEI,
          adminPvtKey,
        );
        if (!gasResult.funded) {
          return {
            error: `Insufficient TRX gas (need ${gasResult.trxNeeded} TRX, have ${gasResult.balance} TRX) and auto-funding failed`,
            status: false,
            data: null,
          };
        }
      } else {
        console.error("[Withdrawal Gas] TRON_ADMIN_PRIVATE_KEY not configured. Cannot auto-fund TRX gas.");
      }

      // Execute the transfer method
      const txid = await contract.methods
        .transfer(receiverAddress, AMOUNT_IN_WEI)
        .send({
          from: userAddress,
          feeLimit: 150000000, // 150 TRX fee limit
        });

      console.log("[merchantTronFundWithdraw] TRC-20 TX broadcast, TxID:", txid);

      // Verify on-chain — catch OUT_OF_ENERGY / REVERT failures
      const verifyResult = await verifyTronTransaction(txid);
      if (verifyResult.status === 'success') {
        console.log("[merchantTronFundWithdraw] ✅ TRC-20 TX verified:", txid);
      } else if (verifyResult.status === 'timeout') {
        // TX was broadcast but couldn't confirm in time → treat as success
        // to prevent double-spend on retry.
        console.warn(
          `[merchantTronFundWithdraw] ⚠️ TX ${txid} verification timed out. ` +
          `TX was broadcast — treating as success to prevent double-spend.`
        );
      } else {
        // status === 'failed' → TX confirmed REVERT on-chain, genuinely failed
        return {
          error: `TRC-20 withdrawal TX ${txid} FAILED on-chain (${verifyResult.receipt})`,
          status: false,
          data: null,
        };
      }
      return {
        error: null,
        status: true,
        data: {
          transactionHash: txid,
          gasUsed: 0,
          effectiveGasPrice: 0,
          blockNumber: 0,
        },
      };
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
    ...tronHeaders,
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
      headers: tronHeaders,
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
