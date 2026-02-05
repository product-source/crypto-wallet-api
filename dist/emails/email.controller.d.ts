import { EmailService } from './email.service';
export declare class EmailController {
    private readonly emailService;
    constructor(emailService: EmailService);
    sendEmail(recipient: string, subject: string, text: string): Promise<{
        message: string;
    }>;
}
