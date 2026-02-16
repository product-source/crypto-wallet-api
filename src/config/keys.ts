export class Keys {
  PORT: string = null;
  MONGO_URL: string = null;
  JWT_SECRET: string = null;
  SMTP_HOST: string = null;
  SMTP_PORT: string = null;
  SMTP_AUTH_EMAIL: string = null;
  SMTP_AUTH_PASS: string = null;
  BASE_URL: string = null;
  WEB_BASE_URL: string = null;
  Admin_BASE_URL: string = null;
  ENCRYPTION_SECRET: string = null;
  WEB_STREAMER_ID: string = null;
  MORALIS_KEY: string = null;
  ADMIN_WALLET_PRIVATE_KEY: string = null;
  TATUM_X_API_KEY: string = null;
  TATUM_NETWORK: string = null;
  TRON_ADMIN_PRIVATE_KEY: string = null;
  TRON_ADMIN_ADDRESS: string = null;
  COINGECKO_PRO_API_KEY: string = null;
  COINGECKO_PRO_URL: string = null;
  TRON_OWNER_ADDRESS: string = null;
  TRON_GRID_API_KEY: string = null;
  EVM_OWNER_ADDRESS: string = null;
  BTC_OWNER_ADDRESS: string = null;
  TRON_NODE: string = null;

  // EVM Network Config
  ETH_CHAIN_ID: string = null;
  ETH_RPC_URL: string = null;
  ETH_EXPLORER_URL: string = null;
  BNB_CHAIN_ID: string = null;
  BNB_RPC_URL: string = null;
  BNB_EXPLORER_URL: string = null;
  POLYGON_CHAIN_ID: string = null;
  POLYGON_RPC_URL: string = null;
  POLYGON_EXPLORER_URL: string = null;

  // Moralis hex chain IDs
  MORALIS_BSC_CHAIN: string = null;
  MORALIS_ETH_CHAIN: string = null;
  MORALIS_POLYGON_CHAIN: string = null;

  // Explorer URLs
  TRON_EXPLORER_URL: string = null;
  BTC_EXPLORER_URL: string = null;

  constructor() {
    try {
      require("dotenv").config();
    } catch (error) { }
    this.prepareKeys();
  }

  prepareKeys() {
    this.PORT = process.env.PORT;
    this.MONGO_URL = process.env.MONGO_URL;
    this.JWT_SECRET = process.env.JWT_SECRET;
    this.SMTP_HOST = process.env.SMTP_HOST;
    this.SMTP_PORT = process.env.SMTP_PORT;
    this.SMTP_AUTH_EMAIL = process.env.SMTP_AUTH_EMAIL;
    this.SMTP_AUTH_PASS = process.env.SMTP_AUTH_PASS;
    this.BASE_URL = process.env.BASE_URL;
    this.WEB_BASE_URL = process.env.WEB_BASE_URL;
    this.Admin_BASE_URL = process.env.Admin_BASE_URL;
    this.ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;
    this.WEB_STREAMER_ID = process.env.WEB_STREAMER_ID;
    this.MORALIS_KEY = process.env.MORALIS_KEY;
    this.ADMIN_WALLET_PRIVATE_KEY = process.env.ADMIN_WALLET_PRIVATE_KEY;
    this.TATUM_X_API_KEY = process.env.TATUM_X_API_KEY;
    this.TATUM_NETWORK = process.env.TATUM_NETWORK;
    this.TRON_ADMIN_PRIVATE_KEY = process.env.TRON_ADMIN_PRIVATE_KEY;
    this.TRON_ADMIN_ADDRESS = process.env.TRON_ADMIN_ADDRESS;
    this.COINGECKO_PRO_API_KEY = process.env.COINGECKO_PRO_API_KEY;
    this.COINGECKO_PRO_URL = process.env.COINGECKO_PRO_URL;
    this.TRON_OWNER_ADDRESS = process.env.TRON_OWNER_ADDRESS;
    this.TRON_GRID_API_KEY = process.env.TRON_GRID_API_KEY;
    this.EVM_OWNER_ADDRESS = process.env.EVM_OWNER_ADDRESS;
    this.BTC_OWNER_ADDRESS = process.env.BTC_OWNER_ADDRESS;
    this.TRON_NODE = process.env.TRON_NODE;

    // EVM Network Config
    this.ETH_CHAIN_ID = process.env.ETH_CHAIN_ID;
    this.ETH_RPC_URL = process.env.ETH_RPC_URL;
    this.ETH_EXPLORER_URL = process.env.ETH_EXPLORER_URL;
    this.BNB_CHAIN_ID = process.env.BNB_CHAIN_ID;
    this.BNB_RPC_URL = process.env.BNB_RPC_URL;
    this.BNB_EXPLORER_URL = process.env.BNB_EXPLORER_URL;
    this.POLYGON_CHAIN_ID = process.env.POLYGON_CHAIN_ID;
    this.POLYGON_RPC_URL = process.env.POLYGON_RPC_URL;
    this.POLYGON_EXPLORER_URL = process.env.POLYGON_EXPLORER_URL;

    // Moralis hex chain IDs
    this.MORALIS_BSC_CHAIN = process.env.MORALIS_BSC_CHAIN;
    this.MORALIS_ETH_CHAIN = process.env.MORALIS_ETH_CHAIN;
    this.MORALIS_POLYGON_CHAIN = process.env.MORALIS_POLYGON_CHAIN;

    // Explorer URLs
    this.TRON_EXPLORER_URL = process.env.TRON_EXPLORER_URL;
    this.BTC_EXPLORER_URL = process.env.BTC_EXPLORER_URL;
  }
}
