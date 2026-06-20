const admin = require("firebase-admin");

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_PROJECT_ID = "studyeezy-4eb9d";

admin.initializeApp({ projectId: "studyeezy-4eb9d" });

const db = admin.firestore();

async function seed() {
  const reviews = await db.collection("aiReviews").get();
  reviews.forEach(doc => {
    console.log(doc.id, "=>", doc.data());
  });
}

seed().catch(console.error);
