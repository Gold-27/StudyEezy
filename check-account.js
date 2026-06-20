const admin = require("firebase-admin");

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_PROJECT_ID = "studyeezy-4eb9d";

const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf-8');
const privateKeyMatch = envContent.match(/FIREBASE_PRIVATE_KEY="([\s\S]*?)"/);
const privateKey = privateKeyMatch ? privateKeyMatch[1].replace(/\\n/g, '\n') : undefined;

const clientEmailMatch = envContent.match(/FIREBASE_CLIENT_EMAIL=(.*)/);
const clientEmail = clientEmailMatch ? clientEmailMatch[1].trim() : undefined;

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: "studyeezy-4eb9d",
    clientEmail: clientEmail,
    privateKey: privateKey,
  })
});

async function checkAccount() {
  const uid = "ovfAYOqj6aXXhJn2qrvWqnCoocY2";
  try {
    const user = await admin.auth().getUser(uid);
    console.log(`Email: ${user.email}`);
    console.log(`Display Name: ${user.displayName}`);
    console.log(`Creation Time: ${user.metadata.creationTime}`);

    const doc = await admin.firestore().collection("users").doc(uid).get();
    console.log("Firestore User Doc exists:", doc.exists);
    if (doc.exists) {
      console.log("Firestore User Doc Data:", doc.data());
    }
  } catch (error) {
    console.error("Error fetching user:", error);
  }
}

checkAccount();
