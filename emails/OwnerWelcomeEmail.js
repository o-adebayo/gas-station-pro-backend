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

function OwnerWelcomeEmail({
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
}) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(
      Preview,
      null,
      "Welcome to Gas Station Pro! Start Managing Your Gas Stations"
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
            `Dear ${ownerName},`
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "Thank you for choosing ",
            React.createElement("strong", null, "Gas Station Pro"),
            " to manage your gas stations efficiently on the cloud! We're excited to have you on board."
          ),
          React.createElement(
            Text,
            { style: paragraph },
            `Your company, `,
            React.createElement("strong", null, companyName),
            ", has been successfully registered on our platform. Below, you'll find your unique Company Code and the link to get started:"
          ),
          React.createElement(
            Text,
            { style: paragraph },
            React.createElement("strong", null, "Company Code: "),
            React.createElement("span", { style: code }, companyCode)
          ),
          React.createElement(
            Text,
            { style: paragraph },
            React.createElement("strong", null, "Registration Link: "),
            React.createElement(
              Link,
              { href: link, style: linkStyle },
              "Register Here"
            )
          ),
          React.createElement(
            Heading,
            { as: "h3", style: header },
            "Your Plan Details"
          ),
          React.createElement(
            "ul",
            { style: list },
            React.createElement(
              "li",
              null,
              React.createElement("strong", null, "Plan Type: "),
              planType
            ),
            React.createElement(
              "li",
              null,
              React.createElement("strong", null, "Plan Cost: "),
              planCost
            ),
            React.createElement(
              "li",
              null,
              React.createElement("strong", null, "Plan Cycle: "),
              planCycle
            ),
            React.createElement(
              "li",
              null,
              React.createElement("strong", null, "Plan Tier: "),
              planTier
            ),
            React.createElement(
              "li",
              null,
              React.createElement("strong", null, "Plan Renewal Date: "),
              planRenewalDate
            ),
            React.createElement(
              "li",
              null,
              React.createElement("strong", null, "Plan Expiry Date: "),
              planExpiryDate
            )
          ),
          React.createElement(
            Heading,
            { as: "h3", style: header },
            "How to Get Started"
          ),
          React.createElement(
            "ul",
            { style: list },
            React.createElement(
              "li",
              null,
              "Use your unique ",
              React.createElement("strong", null, "Company Code"),
              " during registration to set up your user account."
            ),
            React.createElement(
              "li",
              null,
              "As the company owner, you will be automatically assigned the ",
              React.createElement("strong", null, "Admin"),
              " role, giving you full access to manage users, sales reports, and store information."
            ),
            React.createElement(
              "li",
              null,
              "Share your ",
              React.createElement("strong", null, "Company Code"),
              " and registration link with your store managers. When they register, they will be set up as ",
              React.createElement("strong", null, '"Manager"'),
              " users. You can also add users from your Admin page."
            )
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "As an Admin, you can also assign different roles to users in your company from the ",
            React.createElement("strong", null, "Manage Users"),
            " page."
          ),
          React.createElement(
            Heading,
            { as: "h3", style: header },
            "Need Help?"
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "Our support team is available at any time to answer your questions and guide you through setup. Visit our ",
            React.createElement(
              Link,
              {
                href: "https://gasstationpro.com/help",
                style: linkStyle,
              },
              "Help Center"
            ),
            " or reach out to us at ",
            React.createElement(
              Link,
              {
                href: "mailto:support@gasstationpro.com",
                style: linkStyle,
              },
              "support@gasstationpro.com"
            ),
            "."
          ),
          React.createElement(
            Text,
            { style: paragraph },
            "Welcome aboard! Let's transform how you manage your gas stations."
          ),
          React.createElement(
            Text,
            { style: signOff },
            "Regards,",
            React.createElement("br"),
            React.createElement("strong", null, "The Gas Station Pro Team")
          ),
          React.createElement(
            Text,
            { style: footerLinks },
            React.createElement(
              Link,
              {
                href: "https://gasstationpro.com",
                style: linkStyle,
              },
              "Website"
            ),
            " | ",
            React.createElement(
              Link,
              {
                href: "https://gasstationpro.com/help",
                style: linkStyle,
              },
              "Help Center"
            )
          ),
          React.createElement(
            Text,
            { style: footerNote },
            "P.S. Get started today to make the most out of Gas Station Pro's features and streamline your station management effortlessly."
          )
        )
      )
    )
  );
}

module.exports = OwnerWelcomeEmail;

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

const code = {
  backgroundColor: "#f0f0f0",
  padding: "4px",
};

const list = {
  color: "#555",
  paddingLeft: "20px",
};

const linkStyle = {
  color: "#007bff",
};

const signOff = {
  color: "#333",
};

const footerLinks = {
  color: "#007bff",
  fontSize: "0.9rem",
};

const footerNote = {
  fontSize: "0.9rem",
  color: "#777",
};
