
const logo = "../"
export const emailTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .email-container {
            width: 100%;
            max-width: 600px;
            margin: auto;
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #ddd;
        }
        .email-header {
            background-color: #fff;
            padding: 10px 0;
            text-align: center;
        }
        .email-body {
            padding: 20px;
            font-size: 16px;
            color: #333;
        }
        .email-footer {
            background-color: #f6b03d;
            color: white;
            padding: 10px;
            text-align: center;
            font-size: 12px;
        }
        .email-footer a {
            color: white;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Hello,</h1>
        </div>
        <div class="email-body">
            <p>We hope this message finds you well.</p>
            <p>Please find attached your invoice for the recent transaction. If you have any questions, feel free to reply to this email or contact our support team.</p>
            <p>Best regards,<br>COINPERA PRIVATE LIMITED</p>
            // <img src= ${logo} alt="Coinpera Logo" style="width: 150px;">
            <img src=  alt="Coinpera Logo" style="width: 150px;">
        </div>
        <div class="email-footer">
            This email was sent to you by COINPERA PRIVATE LIMITED
        </div>
    </div>
</body>
</html>
`;


