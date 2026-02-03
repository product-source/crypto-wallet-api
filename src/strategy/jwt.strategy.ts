import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AdminDocument, Admin } from "src/admin/schema/admin.schema";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { ConfigService } from "src/config/config.service";
import {
  Merchant,
  MerchantDocument,
} from "src/merchants/schema/merchant.schema";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    @InjectModel(Merchant.name) private merchantModel: Model<MerchantDocument>
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // secretOrKey: jwtConstants.secret,
      secretOrKey: ConfigService.keys.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    let user;

    // Try to find the user in the Admin collection
    user = await this.adminModel.findById({ _id: payload.userId });

    // If not found in Admin, try to find the user in the Inquiry collection
    if (!user) {
      user = await this.merchantModel.findById({ _id: payload.userId });
      if (user.isAccountSuspend) {
        throw new UnauthorizedException("Your account is suspended.");
      }
    }

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      userId: user._id,
      email: user.email,
      isAdmin: payload?.isAdmin,
      role: user.role || null,
      permissions: user.permissions || [],
    };
  }
}
