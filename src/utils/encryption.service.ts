import { BadRequestException, Injectable } from "@nestjs/common";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";
import { ConfigService } from "src/config/config.service";

@Injectable()
export class EncryptionService {
  encryptData(data) {
    try {
      const secret = ConfigService.keys.ENCRYPTION_SECRET;
      const iv = randomBytes(16);
      const key = scryptSync(secret, "salt", 32) as Buffer;
      const cipher = createCipheriv("aes-256-ctr", key, iv);

      const encryptedData = Buffer.concat([
        cipher.update(data),
        cipher.final(),
      ]);
      return JSON.stringify({
        iv: iv.toString("hex"),
        encryptedData: encryptedData.toString("hex"),
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  decryptData(encryptedData) {
    try {
      const secret = ConfigService.keys.ENCRYPTION_SECRET;

      const parsed = JSON.parse(encryptedData);
      const iv = Buffer.from(parsed.iv, "hex");
      encryptedData = Buffer.from(parsed.encryptedData, "hex");
      const key = scryptSync(secret, "salt", 32) as Buffer;
      const decipher = createDecipheriv("aes-256-ctr", key, iv);

      const decryptedData = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ]);
      const str = decryptedData.toString();
      return str;
    } catch (error) {
      console.error("error in decryptData", error);
      throw new BadRequestException(error);
    }
  }
}
