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

function SalesReportSubmissionNotificationEmail({
  ownerName,
  storeName,
  name,
  reportDate,
  link,
}) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, "Sales Report Submission Notification"),
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
            `Hello ${ownerName},`
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "We are pleased to inform you that a sales report has been submitted by the manager of your store ",
            React.createElement("strong", null, storeName),
            "."
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "The sales report was submitted by ",
            React.createElement("strong", null, name),
            " on ",
            React.createElement("strong", null, reportDate),
            "."
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "You can view the full sales report by logging into your account using the link below:"
          ),
          React.createElement(
            "div",
            { style: buttonContainer },
            React.createElement(
              Link,
              { href: link, style: button },
              "View Sales Report"
            )
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "Alternatively, you can click on the link below to access the report directly:"
          ),
          React.createElement(
            Text,
            { style: linkStyle },
            React.createElement(Link, { href: link, style: linkColor }, link)
          ),
          React.createElement("hr", { style: divider }),
          React.createElement(
            Text,
            { style: footerText },
            "If you have any questions or concerns about this report, please contact our support team."
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

module.exports = SalesReportSubmissionNotificationEmail;

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
  textAlign: "center",
  marginBottom: "10px",
};

const linkColor = {
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
