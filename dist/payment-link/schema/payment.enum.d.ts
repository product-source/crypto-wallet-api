export declare enum PaymentStatus {
    PENDING = "PENDING FROM BUYER SIDE",
    PARTIALLY_SUCCESS = "PARTIALLY SUCCESS",
    SUCCESS = "SUCCESS",
    EXPIRED = "EXPIRED"
}
export declare enum WithdrawPaymentStatus {
    PENDING = "PENDING",
    NATIVE_TRANSFER = "NATIVE TRANSFER",
    ADMIN_CHARGES = "ADMIN CHARGE",
    SUCCESS = "SUCCESS"
}
export declare enum WithdrawType {
    ADMIN_CHARGES = "ADMIN CHARGE",
    MERCHANT = "MERCHANT"
}
export declare enum DaysType {
    DAYS = "DAYS",
    WEEKS = "WEEKS",
    MONTHS = "MONTHS",
    YEARS = "YEARS"
}
export declare enum TransactionType {
    FIAT = "FIAT",
    CRYPTO = "CRYPTO"
}
export declare enum CoinId {
    BITCOIN = "bitcoin",
    ETHERUM = "ethereum",
    BNB = "binancecoin",
    TRX = "tron",
    POLYGON = "polygon-ecosystem-token",
    USDT = "tether",
    USDC = "usd-coin",
    WBNB = "wbnb"
}
export declare enum FiatCurrency {
    INR = "inr",
    USD = "usd",
    GBP = "gbp",
    EUR = "eur"
}
export declare enum WithdrawlFiatPaymentStatus {
    PENDING = "PENDING FROM ADMIN SIDE",
    PARTIALLY_SUCCESS = "PARTIALLY SUCCESS",
    SUCCESS = "SUCCESS",
    EXPIRED = "EXPIRED"
}
