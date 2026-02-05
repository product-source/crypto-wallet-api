import { MailerService } from "@nestjs-modules/mailer";
export declare class EmailService {
    private readonly mailerService;
    constructor(mailerService: MailerService);
    sendEmail(recipient: string, subject: string, htmlContent: string): Promise<void>;
    sendEmailWithAttachments(recipient: string, subject: string, htmlContent: string, fileName: string, filePath: string): Promise<void>;
}
