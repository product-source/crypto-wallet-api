export enum UserWithdrawalStatus {
  PENDING = "PENDING",           // Awaiting merchant approval (amount > limit)
  AUTO_APPROVED = "AUTO_APPROVED", // Auto-approved (amount <= limit), processing
  APPROVED = "APPROVED",         // Merchant manually approved
  PROCESSING = "PROCESSING",     // Currently being processed on blockchain
  SUCCESS = "SUCCESS",           // Successfully transferred
  FAILED = "FAILED",             // Failed (insufficient balance, invalid address, etc.)
  DECLINED = "DECLINED",         // Merchant declined the request
}
