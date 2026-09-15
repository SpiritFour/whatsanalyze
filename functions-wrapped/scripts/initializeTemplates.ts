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

  const subscriptionTemplate = {
    subject: "Subscription Confirmation - WhatsAnalyze Wrapped",
    html: `<html><body>
      <h2>Welcome, {{customerName}}!</h2>
      <p>Your subscription has been successfully created.</p>
      <p>Thank you for joining WhatsAnalyze Wrapped. You now have access to all premium features.</p>
      <p><a href="{{loginUrl}}">Open your account</a></p>
      <p><small>If the link doesn't work, copy and paste this URL into your browser:<br/>{{loginUrl}}</small></p>
      <p><small>Your verification code: {{subscriptionId}}</small></p>
      <p>If you have any questions, please reach out to our support team.</p>
      <p>Best regards,<br/>WhatsAnalyze Team</p>
    </body></html>`,
    text: `Welcome, {{customerName}}!\n\nYour subscription has been successfully created.\n\nThank you for joining WhatsAnalyze Wrapped. You now have access to all premium features.\n\nOpen your account: {{loginUrl}}\n\nVerification code (if needed): {{subscriptionId}}\n\nBest regards,\nWhatsAnalyze Team`,
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
