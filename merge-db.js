const admin = require("firebase-admin");

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.FIREBASE_PROJECT_ID = "studyeezy-4eb9d";

admin.initializeApp({ projectId: "studyeezy-4eb9d" });
const db = admin.firestore();

async function merge() {
  const REAL_UID = "ovfAYOqj6aXXhJn2qrvWqnCoocY2";
  const DEV_UID = "dev-user-123";

  const collections = ["studyMaterials", "summaries", "quizAttempts", "quizzes", "flashcards"];

  for (const col of collections) {
    const snapshot = await db.collection(col).where("userId", "==", DEV_UID).get();
    let count = 0;
    const batch = db.batch();
    
    snapshot.forEach(doc => {
      batch.update(doc.ref, { userId: REAL_UID });
      count++;
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Updated ${count} documents in ${col}`);
    } else {
      console.log(`No documents to update in ${col}`);
    }
  }
}

merge().catch(console.error);
