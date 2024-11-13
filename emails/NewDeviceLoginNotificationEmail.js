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

function NewDeviceLoginNotification({ name, link }) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, "New Device Login Attempt Notification"),
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
            "A login attempt was made to your Gas Station Pro account from a new or unrecognized device."
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "To proceed, please enter the following ",
            React.createElement("strong", null, "One-Time Access Code"),
            " to verify your identity:"
          ),
          React.createElement(
            "div",
            { style: codeContainer },
            React.createElement(Text, { style: accessCode }, link)
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "This code is valid for the next ",
            React.createElement("strong", null, "10 minutes"),
            ". If you did not attempt to log in, please secure your account immediately by resetting your password."
          ),
          React.createElement(
            Heading,
            { as: "h3", style: subheader },
            "Need Help?"
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "If you have any questions, feel free to contact our support team at ",
            React.createElement(
              Link,
              { href: "mailto:support@gasstationpro.com", style: supportLink },
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
            { style: footerLinks },
            React.createElement(
              Link,
              { href: "https://gasstationpro.com", style: supportLink },
              "Website"
            ),
            " | ",
            React.createElement(
              Link,
              { href: "https://gasstationpro.com/help", style: supportLink },
              "Help Center"
            )
          ),
          React.createElement(
            Text,
            { style: footerNote },
            "P.S. Your security is important to us. Always use unique passwords and be cautious of phishing attempts."
          )
        )
      )
    )
  );
}

module.exports = NewDeviceLoginNotification;

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

const accessCode = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#007bff",
  padding: "15px",
  backgroundColor: "#f0f0f0",
  borderRadius: "8px",
  display: "inline-block",
};

const subheader = {
  color: "#333",
};

const supportLink = {
  color: "#007bff",
};

const signOff = {
  color: "#333",
};

const footerLinks = {
  textAlign: "center",
  marginTop: "10px",
};

const footerNote = {
  fontSize: "0.9rem",
  color: "#666",
  marginTop: "20px",
};
