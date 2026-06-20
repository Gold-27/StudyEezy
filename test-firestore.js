const { loadEnvConfig } = require('@next/env');
const admin = require('firebase-admin');

loadEnvConfig(process.cwd());

const pk = process.env.FIREBASE_PRIVATE_KEY;
let formattedPrivateKey = pk;
if (formattedPrivateKey.startsWith('"') && formattedPrivateKey.endsWith('"')) {
  formattedPrivateKey = formattedPrivateKey.slice(1, -1);
} else if (formattedPrivateKey.startsWith("'") && formattedPrivateKey.endsWith("'")) {
  formattedPrivateKey = formattedPrivateKey.slice(1, -1);
}
formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
formattedPrivateKey = formattedPrivateKey.replace(/\r/g, '');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: formattedPrivateKey,
  }),
});

const db = admin.firestore();

async function test() {
  try {
    const materialId = 'test-id-123';
    console.log("Attempting to write to firestore...");
    await db.collection("studyMaterials").doc(materialId).set({
      test: true
    });
    console.log("SUCCESSFULLY WROTE TO FIRESTORE");
  } catch (e) {
    console.error("FIRESTORE ERROR:");
    console.error(e);
  }
}

test();
