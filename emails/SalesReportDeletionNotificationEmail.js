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
} = require("@react-email/components");

function SalesReportDeletionNotificationEmail({
  ownerName,
  storeName,
  reportDate,
  updatedDate,
  name,
}) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, "Sales Report Deletion Notification"),
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
            "We would like to inform you that a sales report from your store ",
            React.createElement("strong", null, storeName),
            " has been deleted."
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "The sales report, originally created on ",
            React.createElement("strong", null, reportDate),
            ", was deleted on ",
            React.createElement("strong", null, updatedDate),
            " by ",
            React.createElement("strong", null, name),
            "."
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "Please contact your manager or system administrator if you have any questions regarding this action."
          ),
          React.createElement("hr", { style: divider }),
          React.createElement(
            Text,
            { style: footerText },
            "If you have any concerns or need further assistance, feel free to reach out to our support team."
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

module.exports = SalesReportDeletionNotificationEmail;

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
