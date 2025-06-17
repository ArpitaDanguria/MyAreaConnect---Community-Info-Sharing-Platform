require("dotenv").config(); // Load environment variables

const nodemailer = require("nodemailer");

const sendEmailToAllUsers = async (users, subject, htmlContent) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD, // Use Gmail App Password
    },
  });

  const mailOptions = {
    from: `"Community Portal" <${process.env.EMAIL}>`,
    bcc: users.map((user) => user.email).join(","), // Use BCC for privacy
    subject: subject,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmailToAllUsers;
