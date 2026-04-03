import axios from "axios";
import { ConfigService } from "src/config/config.service";

const TATUM_BASE_URL = "https://api.tatum.io";

function getTatumHeaders() {
  return {
    "x-api-key": ConfigService.keys.TATUM_X_API_KEY,
    "Content-Type": "application/json",
    accept: "application/json",
  };
}

/**
 * Subscribe a Tron address to Tatum ADDRESS_EVENT webhook notifications.
 * Tatum will POST to our webhook endpoint whenever a transaction touches this address.
 * Returns the subscription ID (used to unsubscribe later).
 */
export async function subscribeTronAddressWebhook(
  walletAddress: string
): Promise<string | null> {
  try {
    const networkType =
      ConfigService.keys.NETWORK_MODE === "mainnet" ? "mainnet" : "testnet";

    const webhookUrl = `${ConfigService.keys.API_BASE_URL}tatum-webhook/tron`;

    console.log(
      `[Tatum] Subscribing Tron address ${walletAddress} to webhook → ${webhookUrl} (${networkType})`
    );

    const response = await axios.post(
      `${TATUM_BASE_URL}/v4/subscription?type=${networkType}`,
      {
        type: "ADDRESS_EVENT",
        attr: {
          chain: "TRON",
          address: walletAddress,
          url: webhookUrl,
        },
      },
      { headers: getTatumHeaders() }
    );

    const subscriptionId = response.data?.id;
    console.log(
      `[Tatum] Subscribed successfully. Subscription ID: ${subscriptionId}`
    );
    return subscriptionId;
  } catch (error) {
    console.error(
      "[Tatum] Failed to subscribe Tron address:",
      error?.response?.data || error.message
    );
    return null;
  }
}

/**
 * Unsubscribe a Tron address from Tatum webhook notifications.
 */
export async function unsubscribeTronAddressWebhook(
  subscriptionId: string
): Promise<boolean> {
  try {
    if (!subscriptionId) return false;

    console.log(
      `[Tatum] Unsubscribing webhook. Subscription ID: ${subscriptionId}`
    );

    await axios.delete(
      `${TATUM_BASE_URL}/v4/subscription/${subscriptionId}`,
      { headers: getTatumHeaders() }
    );

    console.log(`[Tatum] Unsubscribed successfully.`);
    return true;
  } catch (error) {
    console.error(
      "[Tatum] Failed to unsubscribe:",
      error?.response?.data || error.message
    );
    return false;
  }
}

/**
 * Get Tron account balance via Tatum API (alternative to TronGrid).
 * Returns TRX balance and TRC20 token balances.
 */
export async function getTronAccountViaTatum(address: string): Promise<any> {
  try {
    const response = await axios.get(
      `${TATUM_BASE_URL}/v3/tron/account/${address}`,
      { headers: getTatumHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error(
      "[Tatum] Failed to get Tron account:",
      error?.response?.data || error.message
    );
    return null;
  }
}

/**
 * Get TRC20 transaction history via Tatum API.
 */
export async function getTronTrc20TransactionsViaTatum(
  address: string
): Promise<any> {
  try {
    const response = await axios.get(
      `${TATUM_BASE_URL}/v3/tron/transaction/account/${address}/trc20`,
      { headers: getTatumHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error(
      "[Tatum] Failed to get TRC20 transactions:",
      error?.response?.data || error.message
    );
    return null;
  }
}

/**
 * Get Tron transaction history via Tatum API.
 */
export async function getTronTransactionsViaTatum(
  address: string
): Promise<any> {
  try {
    const response = await axios.get(
      `${TATUM_BASE_URL}/v3/tron/transaction/account/${address}`,
      { headers: getTatumHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error(
      "[Tatum] Failed to get Tron transactions:",
      error?.response?.data || error.message
    );
    return null;
  }
}

// ---- In-memory balance cache (60s TTL) ----

const balanceCache = new Map<
  string,
  { balance: number; timestamp: number }
>();
const CACHE_TTL_MS = 60_000; // 60 seconds

/**
 * Get cached TRX balance. Uses Tatum API with 60-second cache.
 * Prevents redundant API calls when multiple crons check the same address.
 */
export async function getCachedTronBalance(
  address: string
): Promise<number> {
  const cached = balanceCache.get(address);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.balance;
  }

  try {
    const account = await getTronAccountViaTatum(address);
    // Tatum returns balance in sun, convert to TRX
    const balance = account?.balance
      ? Number(account.balance) / 1_000_000
      : 0;

    balanceCache.set(address, { balance, timestamp: Date.now() });
    return balance;
  } catch (error) {
    console.error("[Tatum] getCachedTronBalance error:", error.message);
    // Return cached value if available (even if stale), otherwise 0
    return cached?.balance || 0;
  }
}
