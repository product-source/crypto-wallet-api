import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('emails')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async sendEmail(
    @Body('recipient') recipient: string,
    @Body('subject') subject: string,
    @Body('text') text: string,
  ) {
    await this.emailService.sendEmail(recipient, subject, text);
    return { message: 'Email sent successfully' };
  }
}
