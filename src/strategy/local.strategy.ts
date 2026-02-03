import { AuthService } from "src/auth/auth.service";
import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: "email" });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new BadRequestException({
        message: "You have entered a wrong email or password",
      });
    }
    return user;
  }
}
