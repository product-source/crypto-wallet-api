"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = exports.Role = void 0;
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "super_admin";
    Role["SUB_ADMIN"] = "sub_admin";
})(Role || (exports.Role = Role = {}));
var Permission;
(function (Permission) {
    Permission["DASHBOARD"] = "dashboard";
    Permission["INQUIRY_MANAGEMENT"] = "inquiry_management";
    Permission["WALLET_MANAGEMENT"] = "wallet_management";
    Permission["MERCHANT_MANAGEMENT"] = "merchant_management";
    Permission["TRANSACTION_MONITORING"] = "transaction_monitoring";
    Permission["FIAT_TRANSACTIONS"] = "fiat_transactions";
    Permission["PAYMENT_MANAGEMENT"] = "payment_management";
    Permission["CONTACT_US"] = "contact_us";
    Permission["CUSTOMER_SUPPORT"] = "customer_support";
    Permission["FAQ_MANAGEMENT"] = "faq_management";
    Permission["CONTENT_MANAGEMENT"] = "content_management";
    Permission["NOTIFICATION"] = "notification";
})(Permission || (exports.Permission = Permission = {}));
//# sourceMappingURL=role.enum.js.map