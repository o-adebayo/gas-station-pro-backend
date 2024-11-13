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
  Link,
} = require("@react-email/components");

function PasswordChangeNotificationEmail({ name, link }) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(
      Preview,
      null,
      "Password Changed for Your Gas Station Pro Account"
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
            "We wanted to let you know that your password for your Gas Station Pro account was recently changed. If you made this change, you can safely ignore this email."
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "However, if you did not change your password, please reset your password immediately by clicking the button below:"
          ),
          React.createElement(
            "div",
            { style: buttonContainer },
            React.createElement(
              Button,
              { href: link, style: resetButton },
              "Reset Password"
            )
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "Alternatively, you can click on the link below to reset your password:"
          ),
          React.createElement(
            Text,
            null,
            React.createElement(Link, { href: link, style: linkStyle }, link)
          ),
          React.createElement("hr", { style: divider }),
          React.createElement(
            Text,
            { style: footerText },
            "If you did not request a password reset or believe this was an error, please contact our support team at ",
            React.createElement(
              Link,
              { href: "mailto:support@gasstationpro.com", style: linkStyle },
              "support@gasstationpro.com"
            ),
            " immediately."
          ),
          React.createElement(
            Text,
            { style: signOff },
            "Regards,",
            React.createElement("br"),
            React.createElement("strong", null, "The Gas Station Pro Team")
          )
        )
      )
    )
  );
}

module.exports = PasswordChangeNotificationEmail;

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

const buttonContainer = {
  textAlign: "center",
  margin: "20px 0",
};

const resetButton = {
  backgroundColor: "#ff0000",
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

const divider = {
  margin: "30px 0",
};

const footerText = {
  fontSize: "0.9rem",
  color: "#777",
};

const signOff = {
  color: "#333",
};
