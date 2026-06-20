const { loadEnvConfig } = require('@next/env');
const admin = require('firebase-admin');

loadEnvConfig(process.cwd());

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
let formattedPrivateKey = privateKey;
if (formattedPrivateKey.startsWith('"') && formattedPrivateKey.endsWith('"')) {
  formattedPrivateKey = formattedPrivateKey.slice(1, -1);
} else if (formattedPrivateKey.startsWith("'") && formattedPrivateKey.endsWith("'")) {
  formattedPrivateKey = formattedPrivateKey.slice(1, -1);
}
formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
formattedPrivateKey = formattedPrivateKey.replace(/\r/g, '');

console.log("FORMATTED KEY START");
console.log(formattedPrivateKey);
console.log("FORMATTED KEY END");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: formattedPrivateKey,
  }),
});

const db = admin.firestore();
db.collection('users').limit(1).get().then(() => console.log('SUCCESS')).catch(e => console.error('FAILED', e));
