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

function StatusChangeNotificationEmail({ name, link }) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, "Account Status Change Notification"),
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
            "We are notifying you that your account status in the Gas Station Pro system has been changed."
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "Please log in to your account to view more details regarding this change."
          ),
          React.createElement(
            "div",
            { style: buttonContainer },
            React.createElement(
              Button,
              { href: link, style: button },
              "Log in to Your Account"
            )
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "Alternatively, you can click on the link below to access your account:"
          ),
          React.createElement(Link, { href: link, style: linkStyle }, link),
          React.createElement(Hr, { style: separator }),
          React.createElement(
            Text,
            { style: footerText },
            "If you have any questions or concerns about this status change, please contact our support team."
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

module.exports = StatusChangeNotificationEmail;

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

const signOff = {
  color: "#333",
};
