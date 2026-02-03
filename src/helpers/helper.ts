import {
  BNB_CHAIN_ID,
  cgHeaders,
  ETH_CHAIN_ID,
  EVM_CHAIN_ID_LIST,
  POLYGON_CHAIN_ID,
  TRON_CHAIN_ID,
} from "./../constants/index";
import * as bitcoin from "bitcoinjs-lib";
import { ConfigService } from "src/config/config.service";
import { isValidTronAddress } from "./tron.helper";
import { isValidEVMAddress } from "./evm.helper";
import Web3 from "web3";
import { BTC_CHAIN_ID } from "src/constants";
import axios from "axios";

export const betweenRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

// export function fromWeiCustom(balance, decimals) {
//   const balanceInStr = balance.toString();
//   const decimal = Number(decimals);
//   const formatedAmount = balanceInStr.substring(
//     0,
//     balanceInStr.length - decimal
//   );
//   return formatedAmount;
// }

export function fromWeiCustom(balance, decimals) {
  const balanceInStr = balance.toString();
  const decimal = Number(decimals);

  // Pad the balance with leading zeros if necessary
  const paddedBalance = balanceInStr.padStart(decimal + 1, "0");
  const integerPart = paddedBalance.substring(
    0,
    paddedBalance.length - decimal
  );
  const fractionalPart = paddedBalance.substring(
    paddedBalance.length - decimal
  );

  return `${integerPart}.${fractionalPart}`;
}

// export function toWeiCustom(amount, decimals) {
//   const amountInStr = amount.toString();
//   const decimal = Number(decimals);

//   // Split the amount into integer and fractional parts
//   const [integerPart, fractionalPart = ""] = amountInStr.split(".");

//   // Pad the fractional part to the required number of decimal places
//   const paddedFractionalPart = fractionalPart
//     .padEnd(decimal, "0")
//     .substring(0, decimal);

//   // Combine the integer part with the padded fractional part
//   const result = integerPart + paddedFractionalPart;

//   // Handle cases where there are no fractional digits and pad with zeros if necessary
//   return result.padEnd(integerPart.length + decimal, "0");
// }

export function toWeiCustom(amount, decimals) {
  const amountInStr = amount.toString();
  const decimal = Number(decimals);

  // Split the amount into integer and fractional parts
  const [integerPart, fractionalPart = ""] = amountInStr.split(".");

  // Pad the fractional part to the required number of decimal places
  const paddedFractionalPart = fractionalPart
    .padEnd(decimal, "0")
    .substring(0, decimal);

  // Combine the integer part with the padded fractional part
  const result = integerPart + paddedFractionalPart;

  // Remove leading zeros
  const trimmedResult = result.replace(/^0+/, "");

  // Handle cases where the entire result becomes empty (e.g., amount = 0)
  return trimmedResult || "0";
}

export function getCoingeckoSymbol(normalSymbol) {
  switch (normalSymbol) {
    case "AVAX":
      return "avalanche-2";
    case "BNB":
      return "binancecoin";
    case "BTC":
      return "bitcoin";
    case "ETH":
      return "ethereum";
    case "USDC":
      return "usd-coin";
    case "TRX":
      return "tron";
    case "USDT":
      return "tether";
    default:
      return normalSymbol;
  }
}

export async function getCoingeckoPrice(currency) {
  try {
    const cg_url = `${ConfigService.keys.COINGECKO_PRO_URL}/api/v3/simple/price?ids=bitcoin,ethereum,matic-network,tether,usd-coin,binancecoin,avalanche-2,tron&vs_currencies=${currency ?? "usd"}`;
    const response = await axios.get(cg_url, {
      headers: cgHeaders,
    });
    return response;
  } catch (error) {
    return null;
  }
}

// Example usage
export function sumBalances(data) {
  const networkTotals = {};

  data.forEach((addressData) => {
    const balances = addressData.balances;

    // Iterate over all networks (bsc, eth, matic, avax)
    Object.keys(balances).forEach((network) => {
      const results = balances[network]?.result || [];

      // Sum the balances for this network
      results.forEach((token) => {
        if (token.balance && !isNaN(token.balance)) {
          const balance = BigInt(token.balance); // Use BigInt for large numbers
          if (!networkTotals[network]) {
            networkTotals[network] = BigInt(0);
          }
          networkTotals[network] += balance;
        }
      });
    });
  });

  // Format totals for easier readability (convert BigInt to string)
  const formattedTotals = {};
  Object.keys(networkTotals).forEach((network) => {
    formattedTotals[network] = networkTotals[network].toString();
  });

  return formattedTotals;
}

export function isValidWalletAddress(
  address: string,
  chianId: string
): boolean {
  try {
    if (chianId === BTC_CHAIN_ID) {
      const network =
        ConfigService.keys.TATUM_NETWORK == "bitcoin-testnet"
          ? bitcoin.networks.testnet
          : bitcoin.networks.bitcoin;
      bitcoin.address.toOutputScript(address, network);
      return true;
    } else if (chianId === TRON_CHAIN_ID) {
      return isValidTronAddress(address);
    } else if (EVM_CHAIN_ID_LIST.includes(chianId)) {
      // Validate EVM-based address
      const web3 = new Web3(); // Initialize Web3 instance
      const isValid = web3.utils.isAddress(address);
      return isValid;
    } else {
      return false; // Unsupported chain ID
    }
  } catch (error) {
    return false;
  }
}

export const generateInvoiceNumber = () => {
  const timestamp = Date.now();
  const randomNumber = Math.floor(Math.random() * 90000) + 10000;
  const invoiceNumber = `INV-${timestamp}-${randomNumber}`;
  return invoiceNumber;
};

export const formatNumber = (input, decimalPlace) => {
  if (!(input && decimalPlace)) {
    return 0;
  }
  let str = input.toString();
  let dotIndex = str.indexOf(".");
  if (dotIndex === -1) {
    return str;
  }
  let preDot = str.substring(0, dotIndex + 1);
  let postDot = str.substring(dotIndex + 1, dotIndex + decimalPlace + 1);

  return preDot + postDot;
};

export const trimAddress = (address, firstChar, lastChar) => {
  if (!address || typeof address !== "string") {
    return "";
  }

  if (address.length <= firstChar + lastChar) {
    return address;
  } else {
    return address.slice(0, firstChar) + "..." + address.slice(-lastChar);
  }
};

export const formatDate = (dateString) => {
  // Convert the date string to a Date object
  const date = new Date(dateString);

  // Array of month names
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Get day, month, year, hours, and minutes
  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Format the date in "DD-Mon-YYYY hh:mmAM/PM" format
  const formattedDate = `${day}-${monthNames[monthIndex]}-${year} ${
    hours % 12 || 12
  }:${minutes < 10 ? "0" + minutes : minutes}${hours >= 12 ? " PM" : " AM"}`;

  return formattedDate;
};

export async function txExplorer(chainId, txHash) {
  switch (chainId) {
    case ETH_CHAIN_ID:
      return {
        explorerURL: `https://sepolia.etherscan.io/tx/${txHash}`,
      };
    case BNB_CHAIN_ID:
      return {
        explorerURL: `https://testnet.bscscan.com/tx/${txHash}`,
      };
    case POLYGON_CHAIN_ID:
      return {
        explorerURL: `https://amoy.polygonscan.com/tx/${txHash}`,
      };
    case "43113":
      return {
        explorerURL: `https://testnet.avascan.info/blockchain/pulsar/tx/${txHash}`,
      };
    case BTC_CHAIN_ID:
      return {
        explorerURL: `https://mempool.space/testnet/tx/${txHash}`,
      };
    case TRON_CHAIN_ID:
      return {
        explorerURL: `https://shasta-tronscan.on.btfs.io/#/transaction/${txHash}`,
      };
    default:
      throw new Error("Unsupported chainId");
  }
}

// export async function calculateTaxes(fullAmount, adminPaymentLinksCharges) {
//   console.log("Calculating Tax Amount : ", {
//     fullAmount,
//     adminPaymentLinksCharges,
//   });

//   let merchantAmount = BigInt(0);
//   let adminAmount = BigInt(0);
//   try {
//     let adminAmountCharge =
//       BigInt(fullAmount) /
//       (BigInt(1) + BigInt(adminPaymentLinksCharges) / BigInt(100));
//     adminAmount = BigInt(fullAmount) - BigInt(adminAmountCharge);
//     merchantAmount = BigInt(fullAmount) - BigInt(adminAmount);
//   } catch (error) {
//     console.log("Error in calculateTaxes", error);
//   }
//   return {
//     merchantAmount,
//     adminAmount,
//   };
// }

export async function calculateTaxes(fullAmount, adminPaymentLinksCharges) {
  console.log("Calculating Tax Amount : ", {
    fullAmount,
    adminPaymentLinksCharges,
  });

  let merchantAmount = 0;
  let adminAmount = 0;
  try {
    // Perform calculations with floating-point numbers
    merchantAmount   = fullAmount / (1 + adminPaymentLinksCharges / 100);
    // adminAmount = fullAmount - adminAmountCharge;
    adminAmount = fullAmount - merchantAmount;
  } catch (error) {
    console.log("Error in calculateTaxes- ", error);
  }

  return {
    merchantAmount,
    adminAmount,
  };
}
