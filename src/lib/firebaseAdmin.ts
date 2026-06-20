import admin from "firebase-admin";

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      let formattedPrivateKey = privateKey;
      // 1. Remove surrounding quotes if they exist
      if (formattedPrivateKey.startsWith('"') && formattedPrivateKey.endsWith('"')) {
        formattedPrivateKey = formattedPrivateKey.slice(1, -1);
      } else if (formattedPrivateKey.startsWith("'") && formattedPrivateKey.endsWith("'")) {
        formattedPrivateKey = formattedPrivateKey.slice(1, -1);
      }
      
      // 2. Replace literal \n with actual newlines
      formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, "\n");

      // 2.5 Remove carriage returns which can break OpenSSL
      formattedPrivateKey = formattedPrivateKey.replace(/\r/g, "");

      // 3. If it was pasted without quotes, it might just be space separated
      if (!formattedPrivateKey.includes("\n")) {
        formattedPrivateKey = formattedPrivateKey
          .replace("-----BEGIN PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----\n")
          .replace("-----END PRIVATE KEY-----", "\n-----END PRIVATE KEY-----");
        
        const parts = formattedPrivateKey.split("\n");
        if (parts.length === 3) {
          parts[1] = parts[1].replace(/ /g, "\n");
          formattedPrivateKey = parts.join("\n");
        }
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } catch (error) {
      console.error("Firebase Admin initialization failed:", error);
    }
  } else {
    if (process.env.NODE_ENV === "production") {
      console.warn("Firebase Admin environment variables are missing.");
    }
  }
}

const adminDb = admin.apps.length ? admin.firestore() : null;
const adminAuth = admin.apps.length ? admin.auth() : null;
const adminStorage = admin.apps.length ? admin.storage() : null;

export { adminDb, adminAuth, adminStorage };
