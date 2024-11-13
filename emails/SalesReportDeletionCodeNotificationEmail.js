const React = require("react");
const {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Img,
  Heading,
  Text,
  Link,
} = require("@react-email/components");

function SalesReportDeletionCodeNotificationEmail({ name, storeName, link }) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(
      Preview,
      null,
      "Report Deletion Confirmation for Gas Station Pro"
    ),
    React.createElement(
      Body,
      { style: main },
      React.createElement(
        Container,
        { style: container },
        React.createElement(
          "div",
          { style: logoContainer },
          React.createElement(Img, {
            src: "https://res.cloudinary.com/dh2lr5aya/image/upload/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/v1728321079/Gas-Station-Pro-logo_gmzb8j.webp",
            alt: "Gas Station Pro Logo",
            style: logo,
          })
        ),
        React.createElement(
          Container,
          { style: contentContainer },
          React.createElement(
            Heading,
            { as: "h2", style: header },
            `Hello ${name},`
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "A request has been made to delete a report from your Gas Station Pro account for the store ",
            React.createElement("strong", null, storeName),
            "."
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "To proceed with the deletion, please enter the following ",
            React.createElement("strong", null, "Report Deletion Code"),
            " to confirm the action:"
          ),
          React.createElement(
            "div",
            { style: codeContainer },
            React.createElement("div", { style: deletionCode }, link)
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "This code is valid for the next ",
            React.createElement("strong", null, "30 minutes"),
            ". If you did not request this action, please contact our support team immediately."
          ),
          React.createElement(
            Heading,
            { as: "h3", style: header },
            "Need Help?"
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "If you have any questions or concerns, feel free to contact our support team at ",
            React.createElement(
              Link,
              { href: "mailto:support@gasstationpro.com", style: linkStyle },
              "support@gasstationpro.com"
            ),
            "."
          ),
          React.createElement(
            Text,
            { style: signOff },
            "Thank you,",
            React.createElement("br"),
            React.createElement("strong", null, "The Gas Station Pro Team")
          ),
          React.createElement(
            Text,
            null,
            React.createElement(
              Link,
              { href: "https://gasstationpro.com", style: linkStyle },
              "Website"
            ),
            " | ",
            React.createElement(
              Link,
              { href: "https://gasstationpro.com/help", style: linkStyle },
              "Help Center"
            )
          ),
          React.createElement(
            Text,
            { style: footerText },
            "P.S. Your security is important to us. Always use unique passwords and be cautious of phishing attempts."
          )
        )
      )
    )
  );
}

module.exports = SalesReportDeletionCodeNotificationEmail;

// Styles remain the same as in your code

const main = {
  fontFamily: "Arial, sans-serif",
  maxWidth: "600px",
  margin: "auto",
  padding: "20px",
  backgroundColor: "#f9f9f9",
  border: "1px solid #ddd",
  borderRadius: "8px",
};

const container = {
  textAlign: "center",
};

const logoContainer = {
  textAlign: "center",
  marginBottom: "20px",
};

const logo = {
  width: "150px",
};

const contentContainer = {
  backgroundColor: "#ffffff",
  padding: "20px",
  borderRadius: "8px",
};

const header = {
  color: "#333",
};

const paragraph = {
  color: "#555",
};

const codeContainer = {
  textAlign: "center",
  margin: "20px 0",
};

const deletionCode = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#dc3545",
  padding: "15px",
  backgroundColor: "#f8d7da",
  borderRadius: "8px",
  display: "inline-block",
};

const linkStyle = {
  color: "#007bff",
};

const signOff = {
  color: "#333",
};

const footerText = {
  fontSize: "0.9rem",
  color: "#666",
};
