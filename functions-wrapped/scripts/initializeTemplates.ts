import * as admin from "firebase-admin";
import * as fs from "fs";

const project = process.argv[2] || "wrapped-dev";

try {
  // Read .firebaserc to get project ID
  const firebaserc = JSON.parse(fs.readFileSync("../.firebaserc", "utf-8"));
  const projectId = firebaserc.projects[project];

  if (!projectId) {
    console.error(`Project "${project}" not found in .firebaserc`);
    process.exit(1);
  }

  // Initialize with just projectId - Firebase CLI auth is used automatically
  admin.initializeApp({
    projectId,
  });

  const db = admin.firestore();

  // The plan is sold as "WhatsAnalyze Pro" on /subscribe, and the restore form
  // there labels the id "Subscription ID" — the email names both the same way,
  // so nobody has to work out which product they bought or which field the id
  // belongs in. The billing block states what a recurring EU charge has to
  // state: the amount, the renewal, and the way out.
  const subscriptionTemplate = {
    subject: "Subscription Confirmation - WhatsAnalyze Pro",
    html: `<html><body>
      <h2>Welcome, {{customerName}}!</h2>
      <p>Your subscription has been successfully created.</p>
      <p>Thank you for joining WhatsAnalyze Pro. You now have access to all premium features, including WhatsApp Wrapped.</p>
      <p><a href="{{loginUrl}}">Open your account</a></p>
      <p><small>If the link doesn't work, copy and paste this URL into your browser:<br/>{{loginUrl}}</small></p>
      <h3>Your billing details</h3>
      <ul>
        <li>Charged today: {{amountPaid}}</li>
        <li>Renews on {{renewalDate}} for {{renewalAmount}} per month</li>
        <li>Subscription ID: {{subscriptionId}}</li>
      </ul>
      <p>You can cancel or pause anytime: open your account and choose "Manage Subscription" to reach the Stripe Customer Portal.</p>
      <p>If you have any questions, please reach out to our support team.</p>
      <p>Best regards,<br/>WhatsAnalyze Team</p>
    </body></html>`,
    text: `Welcome, {{customerName}}!\n\nYour subscription has been successfully created.\n\nThank you for joining WhatsAnalyze Pro. You now have access to all premium features, including WhatsApp Wrapped.\n\nOpen your account: {{loginUrl}}\n\nYour billing details:\n- Charged today: {{amountPaid}}\n- Renews on {{renewalDate}} for {{renewalAmount}} per month\n- Subscription ID: {{subscriptionId}}\n\nYou can cancel or pause anytime: open your account and choose "Manage Subscription" to reach the Stripe Customer Portal.\n\nBest regards,\nWhatsAnalyze Team`,
  };

  db.collection("mailTemplates")
    .doc("subscription-confirmation")
    .set(subscriptionTemplate)
    .then(() => {
      console.log(
        "✅ Email template 'subscription-confirmation' initialized for project:",
        project
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error initializing email templates:", error);
      process.exit(1);
    });
} catch (error: any) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
