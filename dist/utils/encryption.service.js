"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const config_service_1 = require("../config/config.service");
let EncryptionService = class EncryptionService {
    encryptData(data) {
        try {
            const secret = config_service_1.ConfigService.keys.ENCRYPTION_SECRET;
            const iv = (0, crypto_1.randomBytes)(16);
            const key = (0, crypto_1.scryptSync)(secret, "salt", 32);
            const cipher = (0, crypto_1.createCipheriv)("aes-256-ctr", key, iv);
            const encryptedData = Buffer.concat([
                cipher.update(data),
                cipher.final(),
            ]);
            return JSON.stringify({
                iv: iv.toString("hex"),
                encryptedData: encryptedData.toString("hex"),
            });
        }
        catch (error) {
            throw new common_1.BadRequestException(error);
        }
    }
    decryptData(encryptedData) {
        try {
            const secret = config_service_1.ConfigService.keys.ENCRYPTION_SECRET;
            const parsed = JSON.parse(encryptedData);
            const iv = Buffer.from(parsed.iv, "hex");
            encryptedData = Buffer.from(parsed.encryptedData, "hex");
            const key = (0, crypto_1.scryptSync)(secret, "salt", 32);
            const decipher = (0, crypto_1.createDecipheriv)("aes-256-ctr", key, iv);
            const decryptedData = Buffer.concat([
                decipher.update(encryptedData),
                decipher.final(),
            ]);
            const str = decryptedData.toString();
            return str;
        }
        catch (error) {
            console.error("error in decryptData", error);
            throw new common_1.BadRequestException(error);
        }
    }
};
exports.EncryptionService = EncryptionService;
exports.EncryptionService = EncryptionService = __decorate([
    (0, common_1.Injectable)()
], EncryptionService);
//# sourceMappingURL=encryption.service.js.map