import * as bitcoin from "bitcoinjs-lib";
import * as bip39 from "bip39";
import BIP32Factory from "bip32";
import * as ecc from "tiny-secp256k1";
import axios from "axios";
import { ConfigService } from "src/config/config.service";
import { ESTIMATE_GAS_URL, postHeaders, SEND_BTC_URL } from "src/constants";

export const generateBitcoinWallet = (mnemonic: any, index: number) => {
  let btcNetwork = bitcoin.networks.testnet;

  const bip32 = BIP32Factory(ecc);

  const network = ConfigService.keys.TATUM_NETWORK;

  if (network !== "bitcoin-testnet") {
    btcNetwork = bitcoin.networks.bitcoin;
  }

  // const path = `m/44'/0'/0'/0`;
  const path = `m/84'/0'/0'/0/${index}`;

  const seed = bip39.mnemonicToSeedSync(mnemonic);
  let root = bip32?.fromSeed(seed, btcNetwork);

  let account = root.derivePath(path);
  let node = account.derive(0).derive(0);

  // let btcAddress = bitcoin.payments.p2pkh({
  //   pubkey: node.publicKey,
  //   network: network,
  // }).address;

  // Generate a SegWit (Bech32) address using p2wpkh
  let btcAddress = bitcoin.payments.p2wpkh({
    pubkey: node.publicKey,
    network: btcNetwork,
  }).address;

  const wallet = {
    address: btcAddress,
    privateKey: node.toWIF(),
    mnemonic: mnemonic,
    path: path,
    index: index,
  };
  return wallet;

  // const wallet = {
  //   address: btcAddress,
  //   privateKey: node.toWIF(),
  //   mnemonic: mnemonic,
  //   publicKey: node.publicKey,
  // };
  // return wallet;
};

// Bitcoin dust limit — outputs below this are rejected by the network
const BTC_DUST_LIMIT_SATS = 546;
const BTC_DUST_LIMIT = BTC_DUST_LIMIT_SATS / 1e8; // 0.00000546 BTC

export async function btcTransferFromPaymentLinks(
  walletPrivateKey,
  fromAddress,
  merchantToAddress,
  fullAmount,
  isFiat = false,
  ownerAddress = null,
  adminFeePercent = 0,   // e.g. 0.5 means 0.5%
  adminWalletAddress = null
) {

  isFiat = ["true", "1", "yes"].includes(String(isFiat).toLowerCase());

  if (isFiat && !ownerAddress) {
    throw new Error("FIAT transfer requires ownerAddress");
  }

  console.log("⚡ BTC Helper Called With:");
  console.log({
    walletPrivateKey,
    fromAddress,
    merchantToAddress,
    fullAmount,
    isFiat,
    ownerAddress,
    adminFeePercent,
    adminWalletAddress,
  });
  const actualReceiver = isFiat ? ownerAddress : merchantToAddress;

  if (!actualReceiver) {
    throw new Error("Receiver address is missing");
  }

  const changeWallet = fromAddress;

  console.log("➡️ actualReceiver:", actualReceiver);
  console.log("➡️ changeWallet:", changeWallet);

  const fullAmountNum = Number(Number(fullAmount).toFixed(8));

  // --- Calculate admin fee ---
  let adminFeeAmount = 0;
  let merchantAmount = fullAmountNum;
  let canSendAdminFee = false;

  if (adminFeePercent > 0 && adminWalletAddress) {
    adminFeeAmount = Number((fullAmountNum * (adminFeePercent / 100)).toFixed(8));
    merchantAmount = Number((fullAmountNum - adminFeeAmount).toFixed(8));

    // Check if admin fee is above Bitcoin dust limit
    if (adminFeeAmount >= BTC_DUST_LIMIT) {
      canSendAdminFee = true;
      console.log(`✅ Admin fee ${adminFeeAmount} BTC is above dust limit (${BTC_DUST_LIMIT} BTC), will split.`);
    } else {
      // Admin fee too small for Bitcoin network — send all to merchant
      console.log(`⚠️ Admin fee ${adminFeeAmount} BTC is below dust limit (${BTC_DUST_LIMIT} BTC). Skipping admin fee output.`);
      merchantAmount = fullAmountNum;
      adminFeeAmount = 0;
    }
  }

  // --- Estimate gas with ALL outputs ---
  const estimateOutputs = [
    { address: actualReceiver, value: merchantAmount },
  ];
  if (canSendAdminFee) {
    estimateOutputs.push({ address: adminWalletAddress, value: adminFeeAmount });
  }

  const estimateGasPayload = {
    chain: "BTC",
    type: "TRANSFER",
    fromAddress: [fromAddress],
    to: estimateOutputs,
  };

  let txGas;

  try {
    const gasResponse = await axios.post(ESTIMATE_GAS_URL, estimateGasPayload, {
      headers: postHeaders,
    });

    const output = gasResponse.data;

    if (output.slow) {
      txGas = output;
    } else {
      throw output;
    }
  } catch (err) {
    return err.data;
  }

  try {
    const networkFee = Number(txGas["medium"]);
    // Deduct network fee from merchant's portion
    const merchantAmountAfterGas = Number((merchantAmount - networkFee).toFixed(8));

    if (merchantAmountAfterGas <= 0) {
      console.log("❌ Amount after gas is zero or negative. Cannot send BTC.");
      return { error: "Amount too small after deducting network fee" };
    }

    // Build transaction outputs
    const toOutputs = [
      { address: actualReceiver, value: merchantAmountAfterGas },
    ];
    if (canSendAdminFee) {
      toOutputs.push({ address: adminWalletAddress, value: adminFeeAmount });
    }

    const sendBtcPayload = {
      fromAddress: [
        {
          address: fromAddress,
          privateKey: walletPrivateKey,
        },
      ],
      to: toOutputs,
      fee: txGas["medium"],
      changeAddress: changeWallet,
    };

    console.log("➡️ Sending BTC with payload:", JSON.stringify(sendBtcPayload));
    console.log(`💰 Merchant: ${merchantAmountAfterGas} BTC → ${actualReceiver}`);
    if (canSendAdminFee) {
      console.log(`💰 Admin fee: ${adminFeeAmount} BTC → ${adminWalletAddress}`);
    }

    const sendBtcResponse = await axios.post(SEND_BTC_URL, sendBtcPayload, {
      headers: postHeaders,
    });

    // Return enriched result with fee details
    return {
      ...sendBtcResponse.data,
      adminFeeSent: canSendAdminFee,
      adminFeeAmount: canSendAdminFee ? adminFeeAmount : 0,
      merchantAmount: merchantAmountAfterGas,
    };
  } catch (error) {
    console.log(
      "Error in BTC transfer from paymentLink : ",
      error?.response?.data || error.message
    );
    return error?.response?.data || { error: error.message };
  }
}

export const transferBitcoin: any = async (
  senderPrivateKey: string,
  senderAddress: string,
  receiverAddress: string,
  amount: number
) => {
  try {
    console.log("R--------------------------------------------");

    // let fromUTXO = null;
    const network = ConfigService.keys.TATUM_NETWORK;

    const baseURL = "https://api.tatum.io";

    const getUtxoUrl = `${baseURL}/v3/data/utxos?chain=${network}&address=${senderAddress}&totalValue=${amount}`;
    const sentBtcUrl = `${baseURL}/v3/bitcoin/transaction`;

    const headers = {
      accept: "application/json",
      "x-api-key": ConfigService.keys.TATUM_X_API_KEY,
    };

    // Fetch UTXOs
    const utxoResponse = await axios.get(getUtxoUrl, { headers });

    const fromUTXO = await utxoResponse?.data?.map((item: any) => ({
      txHash: item.txHash,
      index: item.index,
      privateKey: senderPrivateKey,
    }));

    if (fromUTXO.length === 0) {
      return {
        status: false,
        error: "Insufficient UTXo for this transactions",
      };
    }

    // Create payload for transaction
    const payload = {
      fromUTXO: fromUTXO,
      to: [{ address: receiverAddress, value: amount }],
    };

    // Send BTC
    const txResponse = await axios.post(sentBtcUrl, payload, {
      headers: {
        ...headers,
        "content-type": "application/json",
      },
    });

    return { status: true, txId: txResponse.data };
  } catch (error) {
    console.error("Error in transferBitcoin:", error?.response?.data?.cause);
    return {
      status: false,
      error: error?.response?.data?.cause
        ? error?.response?.data?.cause
        : error.message,
    };
  }
};

export const getBitcoinBalance: any = async (walletAddress: string) => {
  try {
    // const network = ConfigService.keys.TATUM_NETWORK;

    const baseURL = "https://api.tatum.io";

    const checkBalanceURL = `${baseURL}/v3/bitcoin/address/balance/${walletAddress}`;

    const headers = {
      accept: "application/json",
      "x-api-key": ConfigService.keys.TATUM_X_API_KEY,
    };

    // Fetch UTXOs
    const balance = await axios.get(checkBalanceURL, { headers });

    return { data: balance.data };
  } catch (error) {
    console.error(
      "Error in transferBitcoin:",
      error.response ? error.response.data : error.message
    );
    return {
      status: false,
      error: error.response ? error.response.data : error.message,
    };
  }
};

// export const getBitcoinWalletPublicKey = (privateKeyWIF, isTestnet = true) => {
//   const btcNetwork = isTestnet
//     ? bitcoin.networks.testnet
//     : bitcoin.networks.bitcoin;

//   // Initialize BIP32 using tiny-secp256k1
//   const bip32 = BIP32Factory(ecc);

//   // Import the private key in WIF (Wallet Import Format)
//   const keyPair = bitcoin.ECPair.fromWIF(privateKeyWIF, btcNetwork);

//   // Derive the public key from the private key
//   const publicKey = keyPair.publicKey.toString("hex");

//   return publicKey;
// };

export async function getBTCNativeBalance(walletAddresses) {
  let btc = 0;
  try {
    const baseURL = "https://api.tatum.io";
    const headers = {
      accept: "application/json",
      "x-api-key": ConfigService.keys.TATUM_X_API_KEY,
    };

    if (walletAddresses.length > 0) {
      for (const address of walletAddresses) {
        const checkBalanceURL = `${baseURL}/v3/bitcoin/address/balance/${address}`;
        // Fetch UTXOs
        const response = await axios.get(checkBalanceURL, { headers });
        const balance = response.data;

        btc +=
          parseFloat(balance?.incoming || 0) -
          parseFloat(balance?.outgoing || 0);

        // Uncomment below lines if you want to include pending balances
        // + parseFloat(balance?.incomingPending || 0)
        // - parseFloat(balance?.outgoingPending || 0);
      }
    }
  } catch (error) {
    console.error("Error in getBTCNativeBalance:", error.message);
  } finally {
    return btc;
  }
}

// const url = getBalanceUrl + fromAddress;
// axios
//   .get(url, { headers: postHeaders })
//   .then((response) => {
//     console.log(response.data);
//     return {
//       error: null,
//       status: true,
//       data: response.data,
//     };
//   })
//   .catch((error) => {
//     console.error("Error fetching the data:", error.message);
//     return {
//       error: error.message,
//       status: false,
//       data: null,
//     };
//   });

// export async function merchantBtcFundWithdraw(
//   privateKey,
//   withdrawalAmount,
//   withdrawalAddress,
//   fromAddress,
//   adminCharges,
//   adminWalletAddress
// ) {
//   let txFee = null;

//   const payloadEstimateGas = {
//     chain: "BTC",
//     type: "TRANSFER",
//     fromAddress: [fromAddress],
//     to: [
//       {
//         address: withdrawalAddress,
//         value: withdrawalAmount,
//       },
//     ],
//   };

//   // Get transaction fee
//   axios
//     .post(estimateGasUrl, payloadEstimateGas, {
//       headers: postHeaders,
//     })
//     .then((response) => {
//       txFee = response.data;
//       console.log("response : ", response.data);
//     })
//     .catch((error) => {
//       return {
//         error: error.response ? error.response.data : error.message,
//         status: false,
//         data: null,
//       };
//     });

//   // Transafer Bitocin
//   let receipt = null;

//   const to = [
//     {
//       address: withdrawalAddress,
//       value: withdrawalAmount,
//     },
//     ...(adminCharges > 0
//       ? [
//           {
//             address: adminWalletAddress,
//             value: adminCharges,
//           },
//         ]
//       : []),
//   ];

//   console.log("txFee2 : ", txFee);

//   const payloadToSend = {
//     fromAddress: [
//       {
//         address: fromAddress,
//         privateKey: privateKey,
//       },
//     ],
//     to: to,
//     fee: txFee.medium,
//     changeAddress: fromAddress,
//   };

//   axios
//     .post(sendBtcUrl, payloadToSend, { headers: postHeaders })
//     .then((response) => {
//       console.log(response.data);

//       return {
//         error: null,
//         status: true,
//         data: response.data,
//       };
//     })
//     .catch((error) => {
//       console.error(
//         "Error:",
//         error.response ? error.response.data : error.message
//       );
//       return {
//         error: error.response ? error.response.data : error.message,
//         status: false,
//         data: null,
//       };
//     });

//   const output = {
//     status: true,
//     message: "Success OR Error message",
//     data: {
//       transactionHash: "0x........",
//       gasUsed: 25255,
//       effectiveGasPrice: 9898,
//       blockNumber: 58,
//     },
//   };

//   return {
//     error: null,
//     status: false,
//     data: txFee,
//   };
// }

export async function merchantBtcFundWithdraw(
  privateKey,
  withdrawalAmount,
  withdrawalAddress,
  fromAddress,
  adminCharges,
  adminWalletAddress
) {
  try {
    // 1. Estimate Gas Fees
    const payloadEstimateGas = {
      chain: "BTC",
      type: "TRANSFER",
      fromAddress: [fromAddress],
      to: [
        {
          address: withdrawalAddress,
          value: withdrawalAmount,
        },
      ],
    };

    const gasResponse = await axios.post(ESTIMATE_GAS_URL, payloadEstimateGas, {
      headers: postHeaders,
    });

    const txFee = gasResponse.data;

    if (!txFee || !txFee.medium) {
      throw new Error("Failed to estimate transaction fees.");
    }

    // 2. Prepare Transaction
    const to = [
      {
        address: withdrawalAddress,
        value: withdrawalAmount,
      },
      ...(adminCharges > 0
        ? [
          {
            address: adminWalletAddress,
            value: adminCharges,
          },
        ]
        : []),
    ];

    const payloadToSend = {
      fromAddress: [
        {
          address: fromAddress,
          privateKey: privateKey,
        },
      ],
      to: to,
      fee: txFee.medium,
      changeAddress: fromAddress,
    };

    // 3. Send BTC Transaction
    const sendResponse = await axios.post(SEND_BTC_URL, payloadToSend, {
      headers: postHeaders,
    });

    const receipt = sendResponse.data;

    return {
      error: null,
      status: true,
      data: {
        transactionHash: receipt.txId,
        gasUsed: 25255,
        effectiveGasPrice: 9898,
        blockNumber: 58,
      },
    };
  } catch (error) {
    return {
      error: error.response?.data?.cause || error.response?.data?.message,
      status: false,
      data: null,
    };
  }
}
