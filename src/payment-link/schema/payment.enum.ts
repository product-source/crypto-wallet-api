export enum PaymentStatus {
  PENDING = "PENDING FROM BUYER SIDE",
  PARTIALLY_SUCCESS = "PARTIALLY SUCCESS",
  SUCCESS = "SUCCESS",
  EXPIRED = "EXPIRED",
}

export enum WithdrawPaymentStatus {
  PENDING = "PENDING",
  NATIVE_TRANSFER = "NATIVE TRANSFER",
  ADMIN_CHARGES = "ADMIN CHARGE",
  SUCCESS = "SUCCESS",
}

export enum WithdrawType {
  ADMIN_CHARGES = "ADMIN CHARGE",
  MERCHANT = "MERCHANT",
}

export enum DaysType {
  DAYS = "DAYS",
  WEEKS = "WEEKS",
  MONTHS = "MONTHS",
  YEARS = "YEARS",
}

export enum TransactionType {
  FIAT = "FIAT",
  CRYPTO = "CRYPTO",
}

export enum CoinId {
  BITCOIN = "bitcoin",
  ETHERUM = "ethereum",
  BNB = "binancecoin",
  TRX = "tron",
  POLYGON = "polygon-ecosystem-token",
  USDT = "tether",
  USDC = "usd-coin",
  WBNB = "wbnb",
}

export enum FiatCurrency {
  INR = "inr",
  USD = "usd",
  GBP = "gbp",
  EUR = "eur",
}


export enum WithdrawlFiatPaymentStatus {
  PENDING = "PENDING FROM ADMIN SIDE",
  PARTIALLY_SUCCESS = "PARTIALLY SUCCESS",
  SUCCESS = "SUCCESS",
  EXPIRED = "EXPIRED",
}
