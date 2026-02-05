"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawlFiatPaymentStatus = exports.FiatCurrency = exports.CoinId = exports.TransactionType = exports.DaysType = exports.WithdrawType = exports.WithdrawPaymentStatus = exports.PaymentStatus = void 0;
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING FROM BUYER SIDE";
    PaymentStatus["PARTIALLY_SUCCESS"] = "PARTIALLY SUCCESS";
    PaymentStatus["SUCCESS"] = "SUCCESS";
    PaymentStatus["EXPIRED"] = "EXPIRED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var WithdrawPaymentStatus;
(function (WithdrawPaymentStatus) {
    WithdrawPaymentStatus["PENDING"] = "PENDING";
    WithdrawPaymentStatus["NATIVE_TRANSFER"] = "NATIVE TRANSFER";
    WithdrawPaymentStatus["ADMIN_CHARGES"] = "ADMIN CHARGE";
    WithdrawPaymentStatus["SUCCESS"] = "SUCCESS";
})(WithdrawPaymentStatus || (exports.WithdrawPaymentStatus = WithdrawPaymentStatus = {}));
var WithdrawType;
(function (WithdrawType) {
    WithdrawType["ADMIN_CHARGES"] = "ADMIN CHARGE";
    WithdrawType["MERCHANT"] = "MERCHANT";
})(WithdrawType || (exports.WithdrawType = WithdrawType = {}));
var DaysType;
(function (DaysType) {
    DaysType["DAYS"] = "DAYS";
    DaysType["WEEKS"] = "WEEKS";
    DaysType["MONTHS"] = "MONTHS";
    DaysType["YEARS"] = "YEARS";
})(DaysType || (exports.DaysType = DaysType = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["FIAT"] = "FIAT";
    TransactionType["CRYPTO"] = "CRYPTO";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var CoinId;
(function (CoinId) {
    CoinId["BITCOIN"] = "bitcoin";
    CoinId["ETHERUM"] = "ethereum";
    CoinId["BNB"] = "binancecoin";
    CoinId["TRX"] = "tron";
    CoinId["POLYGON"] = "polygon-ecosystem-token";
    CoinId["USDT"] = "tether";
    CoinId["USDC"] = "usd-coin";
    CoinId["WBNB"] = "wbnb";
})(CoinId || (exports.CoinId = CoinId = {}));
var FiatCurrency;
(function (FiatCurrency) {
    FiatCurrency["INR"] = "inr";
    FiatCurrency["USD"] = "usd";
    FiatCurrency["GBP"] = "gbp";
    FiatCurrency["EUR"] = "eur";
})(FiatCurrency || (exports.FiatCurrency = FiatCurrency = {}));
var WithdrawlFiatPaymentStatus;
(function (WithdrawlFiatPaymentStatus) {
    WithdrawlFiatPaymentStatus["PENDING"] = "PENDING FROM ADMIN SIDE";
    WithdrawlFiatPaymentStatus["PARTIALLY_SUCCESS"] = "PARTIALLY SUCCESS";
    WithdrawlFiatPaymentStatus["SUCCESS"] = "SUCCESS";
    WithdrawlFiatPaymentStatus["EXPIRED"] = "EXPIRED";
})(WithdrawlFiatPaymentStatus || (exports.WithdrawlFiatPaymentStatus = WithdrawlFiatPaymentStatus = {}));
//# sourceMappingURL=payment.enum.js.map