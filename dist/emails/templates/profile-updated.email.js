"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileUpdateTemplate = profileUpdateTemplate;
function profileUpdateTemplate(user) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Profile Updated Successfully</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7f7f7;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f7f7f7; padding: 20px;">
            <tr>
              <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td align="center" style="padding: 20px; background-color: #ffffff;">
                      <img src="https://crypto-wallet-api.devtechnosys.tech/logo/logo.png" alt="Company Logo" style="max-width: 200px; height: auto;">
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="background-color: #000; padding: 20px; color: #ffffff; font-size: 24px; font-weight: bold;">
                      Profile Updated Successfully
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                      <p>Hi ${user.name},</p>
                      <p>Your profile details have been successfully updated. Below are your latest details:</p>
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; font-size: 14px; color: #555555;">
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Name:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${user.name}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Email:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${user.email}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Platform Name:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${user.platformName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Platform Category:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${user.platformCategory}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Contact Number:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${user.countryCode}${user.contactNumber}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Location:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${user.location}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Description:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${user.description}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold;">Account Suspended:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; color: ${user.isAccountSuspend ? "red" : "green"};">
                            ${user.isAccountSuspend ? "Yes" : "No"}
                          </td>
                        </tr>
                      </table>
                      <p>If you did not make these changes or have any concerns, please contact our support team immediately.</p>
                      <p>Best regards,<br>The Coinpera Team</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f0f0f0; text-align: center; padding: 15px; font-size: 12px; color: #999999;">
                      &copy; ${new Date().getFullYear()} Coinpera. All rights reserved.<br>
                      Need help? <a href="mailto:support@coinpera.com" style="color: #007bff;">Contact Support</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>`;
}
//# sourceMappingURL=profile-updated.email.js.map