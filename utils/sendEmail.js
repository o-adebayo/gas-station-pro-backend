const { Resend } = require("resend");
const { render } = require("@react-email/render");
const React = require("react");
const {
  ActivateAccountEmail,
  AdminCreatedAccountEmail,
  AdminSetPasswordNotificationEmail,
  ExpiredActivationLinkEmail,
  ManagerAssignmentNotificationEmail,
  NewCompanySignupNotificationEmail,
  NewDeviceLoginNotificationEmail,
  OwnerWelcomeEmail,
  PasswordChangeNotificationEmail,
  PasswordResetEmail,
  ReportDeletionConfirmationEmail,
  RoleUpdateNotificationEmail,
  SalesReportSubmissionNotificationEmail,
  StatusChangeNotificationEmail,
  SalesReportUpdatedNotificationEmail,
} = require("../emails");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({
  subject,
  send_to,
  template,
  name,
  link,
  html, // Allow custom HTML input directly
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
  planExpiryDate,
  ownerEmail,
  signupDate,
}) => {
  let emailHtml;

  if (html) {
    // Use provided HTML directly if it exists
    emailHtml = html;
  } else if (template) {
    // Otherwise, render based on template
    const getTemplateComponent = (templateName) => {
      switch (templateName) {
        case "ActivateAccountEmail":
          return React.createElement(ActivateAccountEmail, { name, link });
        case "AdminCreatedAccountEmail":
          return React.createElement(AdminCreatedAccountEmail, { name, link });
        case "AdminSetPasswordNotificationEmail":
          return React.createElement(AdminSetPasswordNotificationEmail, {
            name,
            link,
          });
        case "ExpiredActivationLinkEmail":
          return React.createElement(ExpiredActivationLinkEmail, {
            name,
            link,
          });
        case "ManagerAssignmentNotification":
          return React.createElement(ManagerAssignmentNotificationEmail, {
            name,
            storeName,
            link,
          });
        case "NewCompanySignupNotification":
          return React.createElement(NewCompanySignupNotificationEmail, {
            ownerName,
            ownerEmail,
            companyName,
            signupDate,
          });
        case "NewDeviceLoginNotification":
          return React.createElement(NewDeviceLoginNotificationEmail, {
            name,
            link,
          });
        case "OwnerWelcomeEmail":
          return React.createElement(OwnerWelcomeEmail, {
            ownerName,
            companyName,
            companyCode,
            link,
            planType,
            planCost,
            planCycle,
            planTier,
            planRenewalDate,
            planExpiryDate,
          });
        case "PasswordChangeNotification":
          return React.createElement(PasswordChangeNotificationEmail, {
            name,
            link,
          });
        case "PasswordResetEmail":
          return React.createElement(PasswordResetEmail, { name, link });
        case "ReportDeletionConfirmation":
          return React.createElement(ReportDeletionConfirmationEmail, {
            name,
            storeName,
            link,
          });
        case "RoleUpdateNotificationEmail":
          return React.createElement(RoleUpdateNotificationEmail, {
            name,
            link,
          });
        case "SalesReportSubmissionNotification":
          return React.createElement(SalesReportSubmissionNotificationEmail, {
            ownerName,
            storeName,
            name: managerName,
            reportDate,
            link,
          });
        case "StatusChangeNotificationEmail":
          return React.createElement(StatusChangeNotificationEmail, {
            name,
            link,
          });
        case "SalesReportUpdatedNotificationEmail":
          return React.createElement(SalesReportUpdatedNotificationEmail, {
            ownerName,
            storeName,
            updatedDate,
            name,
            link,
          });
        default:
          throw new Error(`Unknown email template: ${templateName}`);
      }
    };

    const emailComponent = getTemplateComponent(template);
    emailHtml = render(emailComponent);
  } else {
    throw new Error("No HTML content or template provided for the email.");
  }

  try {
    const response = await resend.emails.send({
      from: "Gas Station Pro <no-reply@gasstationpro.com>",
      to: send_to,
      subject: subject,
      html: emailHtml,
    });

    console.log("Email sent:", response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

// Test function to send a simple email
const sendTestEmail = async () => {
  try {
    const data = await resend.emails.send({
      from: "Gas Station Pro <no-reply@gasstationpro.com>",
      to: "gsp.m.testing1@gmail.com",
      subject: "Test Email",
      html: "<p>This is a test email.</p>",
    });
    console.log("Email sent successfully:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error sending email:", JSON.stringify(error, null, 2));
  }
};

// Call this function directly for testing purposes
sendTestEmail();

module.exports = sendEmail;
