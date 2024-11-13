const React = require("react");
const {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
} = require("@react-email/components");

function NewCompanySignupNotificationEmail({
  ownerName,
  ownerEmail,
  companyName,
  signupDate,
}) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, "New Company Signup Notification"),
    React.createElement(
      Body,
      { style: main },
      React.createElement(
        Container,
        { style: contentContainer },
        React.createElement(
          Heading,
          { as: "h2", style: header },
          "New Company Signup"
        ),
        React.createElement(
          Text,
          { style: paragraph },
          "A new company has signed up on Gas Station Pro. Here are the details:"
        ),
        React.createElement(
          Text,
          { style: detail },
          React.createElement("strong", null, "Owner Name:"),
          ` ${ownerName}`
        ),
        React.createElement(
          Text,
          { style: detail },
          React.createElement("strong", null, "Owner Email:"),
          ` ${ownerEmail}`
        ),
        React.createElement(
          Text,
          { style: detail },
          React.createElement("strong", null, "Company Name:"),
          ` ${companyName}`
        ),
        React.createElement(
          Text,
          { style: detail },
          React.createElement("strong", null, "Signup Date:"),
          ` ${signupDate}`
        ),
        React.createElement(
          Text,
          { style: footerNote },
          "You can log in to your admin dashboard for more details or to take further action."
        )
      )
    )
  );
}

module.exports = NewCompanySignupNotificationEmail;

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

const contentContainer = {
  backgroundColor: "#ffffff",
  padding: "20px",
  borderRadius: "8px",
};

const header = {
  color: "#333",
  marginBottom: "10px",
};

const paragraph = {
  color: "#555",
  marginBottom: "15px",
};

const detail = {
  color: "#555",
  marginBottom: "8px",
};

const footerNote = {
  fontSize: "0.9rem",
  color: "#777",
  marginTop: "20px",
};
