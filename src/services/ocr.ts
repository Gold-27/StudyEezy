import crypto from "crypto";

/**
 * Signs a JWT assertion for Google OAuth using Node's native crypto module.
 */
function signJwt(payload: any, privateKey: string, clientEmail: string): string {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const base64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signInput = `${base64Header}.${base64Payload}`;
  
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signInput);
  const signature = signer.sign(privateKey, "base64url");
  
  return `${signInput}.${signature}`;
}

/**
 * Obtains a Google API Access Token using service account credentials.
 */
async function getGoogleAccessToken(serviceAccount: any): Promise<string> {
  const privateKey = serviceAccount.private_key;
  const clientEmail = serviceAccount.client_email;
  const tokenUrl = "https://oauth2.googleapis.com/token";

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: tokenUrl,
    exp: now + 3600,
    iat: now,
  };

  const assertion = signJwt(payload, privateKey, clientEmail);

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google OAuth token request failed: ${errorText}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Mock OCR fallback for testing when Google credentials are not set.
 */
function getMockOCRText(): string {
  return [
    "PHOTOSYNTHESIS STUDY SUMMARY",
    "Photosynthesis is a chemical process used by plants, algae, and certain bacteria to convert light energy into chemical energy.",
    "The primary chemical equation is: 6CO2 + 6H2O + light energy -> C6H12O6 + 6O2.",
    "This occurs inside chloroplasts using pigment molecules called chlorophyll, absorbing sunlight (mostly red and blue light).",
    "The process is split into Light-Dependent Reactions (producing ATP and NADPH in the thylakoid membrane) and the Light-Independent Reactions or Calvin Cycle (synthesizing glucose in the stroma using carbon dioxide)."
  ].join("\n");
}

/**
 * Standard OCR service connecting to Google Vision REST API.
 */
export async function performOCR(imageBuffer: Buffer): Promise<string> {
  const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  
  if (!credsJson || credsJson.includes("your_google_service_account_json")) {
    console.warn("GOOGLE_APPLICATION_CREDENTIALS_JSON is unconfigured. Falling back to mock text extraction.");
    return getMockOCRText();
  }

  try {
    const serviceAccount = JSON.parse(credsJson);
    const accessToken = await getGoogleAccessToken(serviceAccount);
    const base64Image = imageBuffer.toString("base64");
    const visionUrl = "https://vision.googleapis.com/v1/images:annotate";

    const res = await fetch(visionUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: "TEXT_DETECTION",
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Google Vision API responded with code ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    const annotations = data.responses?.[0]?.textAnnotations;
    if (annotations && annotations.length > 0) {
      return annotations[0].description || "";
    }

    return "";
  } catch (error) {
    console.error("OCR execution failed:", error);
    throw new Error("Unable to extract text from this image. Please verify file quality.");
  }
}
