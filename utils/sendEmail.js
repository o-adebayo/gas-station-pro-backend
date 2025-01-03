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
  SalesReportDeletionCodeNotificationEmail,
  SalesReportDeletionNotificationEmail,
  RoleUpdateNotificationEmail,
  SalesReportSubmissionNotificationEmail,
  SalesReportImportNotificationEmail,
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
        case "ManagerAssignmentNotificationEmail":
          return React.createElement(ManagerAssignmentNotificationEmail, {
            name,
            storeName,
            link,
          });
        case "NewCompanySignupNotificationEmail":
          return React.createElement(NewCompanySignupNotificationEmail, {
            ownerName,
            ownerEmail,
            companyName,
            signupDate,
          });
        case "NewDeviceLoginNotificationEmail":
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
        case "PasswordChangeNotificationEmail":
          return React.createElement(PasswordChangeNotificationEmail, {
            name,
            link,
          });
        case "PasswordResetEmail":
          return React.createElement(PasswordResetEmail, { name, link });
        case "SalesReportDeletionNotificationEmail":
          return React.createElement(SalesReportDeletionNotificationEmail, {
            name,
            ownerName,
            storeName,
            reportDate,
            updatedDate,
            link,
          });
        case "SalesReportDeletionCodeNotificationEmail":
          return React.createElement(SalesReportDeletionCodeNotificationEmail, {
            name,
            storeName,
            link,
          });
        case "RoleUpdateNotificationEmail":
          return React.createElement(RoleUpdateNotificationEmail, {
            name,
            link,
          });
        case "SalesReportSubmissionNotificationEmail":
          return React.createElement(SalesReportSubmissionNotificationEmail, {
            ownerName,
            storeName,
            name: managerName,
            reportDate,
            link,
          });
        case "SalesReportImportNotificationEmail":
          return React.createElement(SalesReportImportNotificationEmail, {
            ownerName,
            companyName,
            importDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
            totalImported,
            totalExisting,
            totalInvalid,
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
      emailHtml = "<p>There was an error generating the email content.</p>"; // Default content
    }
  }

  // Ensure emailHtml is a valid string before sending
  if (typeof emailHtml !== "string" || emailHtml.trim() === "") {
    console.error(
      "Email HTML is empty or invalid. Falling back to default content."
    );
    emailHtml = "<p>There was an error generating the email content.</p>";
  }

  // Log values to confirm each part of the email is present
  console.log("Attempting to send email with the following data:");
  console.log("Subject:", subject);
  console.log("To:", send_to);
  console.log("HTML Content:", emailHtml);
  console.log("Link:", link);

  if (!send_to) {
    console.error("Missing 'to' field in sendEmail function.");
    throw new Error("Missing `to` field for sending email.");
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
