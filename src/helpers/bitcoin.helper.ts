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

export async function btcTransferFromPaymentLinks(
  walletPrivateKey,
  fromAddress,
  merchantToAddress,
  fullAmount,
  isFiat = false,
  ownerAddress = null  // fia
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
  });
   const actualReceiver = isFiat ? ownerAddress : merchantToAddress;

   if (!actualReceiver) {
    throw new Error("Receiver address is missing");
  }

   const changeWallet = fromAddress;

  console.log("➡️ actualReceiver:", actualReceiver);
  console.log("➡️ changeWallet:", changeWallet); 

  const fullAmountInSatoshi = Number(fullAmount).toFixed(8);

  const estimateGasPayload = {
    chain: "BTC",
    type: "TRANSFER",
    fromAddress: [fromAddress],
    to: [
      {
        address: actualReceiver,
        value: Number(fullAmountInSatoshi),
      },
    ],
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
    const amountAfterTax =
      Number(fullAmountInSatoshi) - Number(txGas["medium"]);

    const sendBtcPayload = {
      fromAddress: [
        {
          address: fromAddress,
          privateKey: walletPrivateKey,
        },
      ],
      to: [
        {
          address: actualReceiver,
          value: Number(amountAfterTax.toFixed(8)), // 0.00001
        },
      ],
      fee: txGas["medium"],
      changeAddress: changeWallet,
    };

        console.log("➡️ Sending BTC with payload:", sendBtcPayload);


    const sendBtcResponse = await axios.post(SEND_BTC_URL, sendBtcPayload, {
      headers: postHeaders,
    });

    return sendBtcResponse.data;
  } catch (error) {
    console.log(
      "Error in Transaction Native token from paymentLink : ",
      error.response.data
    );
    return error.response.data;
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
