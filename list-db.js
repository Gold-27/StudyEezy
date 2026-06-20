const { loadEnvConfig } = require('@next/env');
const { GoogleAuth } = require('google-auth-library');

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

const auth = new GoogleAuth({
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: formattedPrivateKey,
  },
  scopes: ['https://www.googleapis.com/auth/datastore', 'https://www.googleapis.com/auth/cloud-platform'],
});

async function listDatabases() {
  try {
    const client = await auth.getClient();
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases`;
    
    console.log(`Fetching databases from: ${url}`);
    const res = await client.request({ url });
    
    console.log("Databases found:");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error("Failed to list databases:");
    console.error(error);
  }
}

listDatabases();
