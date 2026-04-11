const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.syncUserEmail = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const userId = context.params.userId;

    // Only act if the email actually changed
    if (beforeData.email === afterData.email) {
      return null;
    }

    const oldEmail = beforeData.email;
    const newEmail = afterData.email;

    console.log(`User ${userId} email changed from ${oldEmail} to ${newEmail}. Updating Auth...`);

    try {
      await admin.auth().updateUser(userId, { email: newEmail });
      console.log(`Successfully updated email for user ${userId}`);
    } catch (error) {
      console.error(`Failed to update email for user ${userId}:`, error);
      // Optionally revert Firestore change
      // await change.after.ref.update({ email: oldEmail });
    }

    return null;
  });