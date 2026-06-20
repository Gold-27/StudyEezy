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

async function createDatabase() {
  try {
    const client = await auth.getClient();
    const projectId = process.env.FIREBASE_PROJECT_ID;
    
    // First, list locations to pick a valid one
    const locUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/locations`;
    const locRes = await client.request({ url: locUrl });
    const locationId = locRes.data.locations ? locRes.data.locations[0].locationId : 'nam5';
    console.log("Using location:", locationId);

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases?databaseId=(default)`;
    
    console.log(`Creating database at: ${url}`);
    const res = await client.request({ 
      url,
      method: 'POST',
      data: {
        type: 'FIRESTORE_NATIVE',
        locationId: locationId
      }
    });
    
    console.log("Database created successfully:");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error("Failed to create database:");
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error);
    }
  }
}

createDatabase();
