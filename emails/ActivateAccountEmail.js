// src/emails/ActivateAccountEmail.js
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
  Button,
  Hr,
  Link,
} = require("@react-email/components");

function ActivateAccountEmail({ name, link }) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, "Activate Your Gas Station Pro Account"),
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
            `Welcome to Gas Station Pro, ${name}!`
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "We’re thrilled to have you join us! Gas Station Pro is here to make managing your gas station simple and efficient, with everything you need at your fingertips. You can easily keep track of daily sales, manage operations, and stay on top of everything that matters for smooth operations."
          ),
          React.createElement(
            Heading,
            { as: "h3", style: subheader },
            "Benefits of Using Gas Station Pro:"
          ),
          React.createElement(
            "ul",
            { style: list },
            React.createElement(
              "li",
              null,
              "Manage daily sales reports and track performance."
            ),
            React.createElement(
              "li",
              null,
              "Gain access to all your station data from anywhere, anytime."
            ),
            React.createElement(
              "li",
              null,
              "Enjoy seamless collaboration with your team and the company owner."
            )
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "To get started, please activate your account by clicking the button below. This activation link will only be valid for the next ",
            React.createElement("strong", null, "24 hours"),
            "."
          ),
          React.createElement(
            "div",
            { style: buttonContainer },
            React.createElement(
              Button,
              { href: link, style: button },
              "Activate Account"
            )
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "Alternatively, you can click on the link below to activate your account:"
          ),
          React.createElement(Link, { href: link, style: linkStyle }, link),
          React.createElement(Hr, { style: separator }),
          React.createElement(
            Text,
            { style: footerText },
            "If you have any questions or need help, please reach out to our support team at ",
            React.createElement(
              Link,
              { href: "mailto:support@gasstationpro.com", style: supportLink },
              "support@gasstationpro.com"
            ),
            ". We're here to help you get the most out of Gas Station Pro!"
          ),
          React.createElement(
            Text,
            { style: signOff },
            "Welcome aboard,",
            React.createElement("br"),
            React.createElement("strong", null, "The Gas Station Pro Team")
          )
        )
      )
    )
  );
}

module.exports = ActivateAccountEmail;

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

const subheader = {
  color: "#333",
};

const list = {
  color: "#555",
  paddingLeft: "20px",
  lineHeight: "1.6",
};

const buttonContainer = {
  textAlign: "center",
  margin: "20px 0",
};

const button = {
  backgroundColor: "#007bff",
  color: "#ffffff",
  textDecoration: "none",
  padding: "15px 25px",
  borderRadius: "5px",
  fontWeight: "bold",
  display: "inline-block",
};

const linkStyle = {
  color: "#007bff",
};

const separator = {
  margin: "30px 0",
};

const footerText = {
  fontSize: "0.9rem",
  color: "#777",
};

const supportLink = {
  color: "#007bff",
};

const signOff = {
  color: "#333",
};
