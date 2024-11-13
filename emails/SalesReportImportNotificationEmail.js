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

function SalesReportImportNotificationEmail({
  ownerName,
  companyName,
  importDate,
  totalImported,
  totalExisting,
  totalInvalid,
}) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, "Sales Report Import Summary"),
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
            `We have completed the import of sales reports for your company, ${companyName}.`
          ),
          React.createElement(
            Text,
            { style: paragraph },
            `Here is a summary of the import conducted on ${importDate}:`
          ),
          React.createElement(
            "ul",
            { style: summaryList },
            React.createElement(
              "li",
              { style: summaryItem },
              `Total Reports Imported: `,
              React.createElement("strong", null, totalImported)
            ),
            React.createElement(
              "li",
              { style: summaryItem },
              `Total Existing Reports Skipped: `,
              React.createElement("strong", null, totalExisting)
            ),
            React.createElement(
              "li",
              { style: summaryItem },
              `Total Invalid Rows: `,
              React.createElement("strong", null, totalInvalid)
            )
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "If you have any questions or require further assistance, please contact our support team."
          ),
          React.createElement("hr", { style: divider }),
          React.createElement(
            Text,
            { style: footerText },
            "Thank you for choosing Gas Station Pro."
          ),
          React.createElement(
            Text,
            { style: signOff },
            "Best regards,",
            React.createElement("br"),
            React.createElement("strong", null, "The Gas Station Pro Team")
          )
        )
      )
    )
  );
}

module.exports = SalesReportImportNotificationEmail;

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
  marginBottom: "15px",
};

const summaryList = {
  color: "#555",
  textAlign: "left",
  margin: "20px 0",
  paddingLeft: "20px",
};

const summaryItem = {
  marginBottom: "10px",
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
