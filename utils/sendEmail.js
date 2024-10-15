const nodemailer = require("nodemailer");
const path = require("path");

const sendEmail = async (
  subject,
  send_to,
  sent_from,
  reply_to,
  template,
  name,
  link,
  companyCode,
  ownerName,
  companyName,
  storeName,
  managerName,
  reportDate,
  updatedDate,
  planType,
  planCost,
  planCycle,
  planTier,
  planRenewalDate,
  planExpiryDate
) => {
  // Dynamically import nodemailer-express-handlebars
  const { default: hbs } = await import("nodemailer-express-handlebars");

  // Create Email Transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: process.env.EMAIL_HOST,
    port: 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const handlearOptions = {
    viewEngine: {
      extName: ".handlebars",
      partialsDir: path.resolve("./views"),
      defaultLayout: false,
    },
    viewPath: path.resolve("./views"),
    extName: ".handlebars",
  };

  // Use the handlebars plugin
  transporter.use("compile", hbs(handlearOptions));

  // Options for sending email
  const options = {
    from: {
      name: "Gas Station Pro",
      sent_from,
    },
    to: send_to,
    replyTo: reply_to,
    subject,
    template,
    context: {
      //these are the variables that will be dynamic in our emails
      name,
      companyCode,
      link,
      ownerName,
      companyName,
      storeName,
      managerName,
      reportDate,
      updatedDate,
      planType,
      planCost,
      planCycle,
      planTier,
      planRenewalDate,
      planExpiryDate,
    },
  };

  // Send Email
  transporter.sendMail(options, function (err, info) {
    if (err) {
      console.log(err);
    } else {
      console.log(info);
    }
  });
};

module.exports = sendEmail;

/* 
old method before switching to express bars
const sendEmail = async (subject, message, send_to, sent_from, reply_to) => {
  // Create Email Transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // Option for sending email
  const options = {
    from: sent_from,
    to: send_to,
    replyTo: reply_to,
    subject: subject,
    html: message,
  };

  // send email
  transporter.sendMail(options, function (err, info) {
    if (err) {
      console.log(err);
    } else {
      console.log(info);
    }
  });
}; 

module.exports = sendEmail;
*/
