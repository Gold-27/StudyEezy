const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const pk = process.env.FIREBASE_PRIVATE_KEY;
console.log("RAW PK:", JSON.stringify(pk));

let formattedPrivateKey = pk;
if (formattedPrivateKey.startsWith('"') && formattedPrivateKey.endsWith('"')) {
  formattedPrivateKey = formattedPrivateKey.slice(1, -1);
} else if (formattedPrivateKey.startsWith("'") && formattedPrivateKey.endsWith("'")) {
  formattedPrivateKey = formattedPrivateKey.slice(1, -1);
}
formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
formattedPrivateKey = formattedPrivateKey.replace(/\r/g, '');

console.log("FORMATTED PK:", JSON.stringify(formattedPrivateKey));
