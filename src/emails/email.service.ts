import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(recipient: string, subject: string, htmlContent: string) {
    try {
      await this.mailerService.sendMail({
        to: recipient,
        subject,
        // text,
        html: htmlContent,
      });
      console.log("Email sent successfully!");
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  async sendEmailWithAttachments(
    recipient: string,
    subject: string,
    htmlContent: string,
    fileName: string,
    filePath: string
  ) {
    try {
      await this.mailerService.sendMail({
        to: recipient,
        subject: subject,
        html: htmlContent,
        attachments: [
          {
            filename: fileName,
            path: filePath,
            contentDisposition: "attachment",
          },
        ],
      });
      console.log("Email sent successfully!");
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email"); // Re-throw the error with a custom message
    }
  }
}
