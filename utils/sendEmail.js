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
  let emailHtml = html;

  if (!html && template) {
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

    try {
      const emailComponent = getTemplateComponent(template);
      emailHtml = await render(emailComponent); // Use await here
      console.log("Generated email HTML:", emailHtml);
    } catch (renderError) {
      console.error("Error rendering email component:", renderError);
    }
  }

  // Ensure emailHtml is a valid string before sending
  if (typeof emailHtml !== "string" || emailHtml.trim() === "") {
    console.error(
      "Email HTML is empty or invalid. Falling back to default content."
    );
    emailHtml = "<p>There was an error generating the email content.</p>";
  }

  try {
    const response = await resend.emails.send({
      from: "Gas Station Pro <no-reply@gasstationpro.com>",
      to: send_to,
      subject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = sendEmail;
