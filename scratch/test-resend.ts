import { Resend } from "resend";
import * as fs from "fs";
import * as path from "path";

// Read API key manually to avoid needing dotenv package
const envContent = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
const match = envContent.match(/RESEND_API_KEY="?(re_[A-Za-z0-9_]+)"?/);

if (!match) {
  console.error("❌ ERROR: Valid Resend API key (starting with 're_') not found in .env.local");
  process.exit(1);
}

const apiKey = "re_1234567890abcdef"; // fake key
const resend = new Resend(apiKey);

async function testResend() {
  console.log("Testing Resend API Key...");
  
  try {
    const data = await resend.emails.send({
      from: "StudyEezy <onboarding@resend.dev>",
      to: ["test-validation@example.com"], // Sending to unverified domain to test if key works
      subject: "Test Configuration",
      html: "<p>This is a test.</p>",
    });
    
    if (data.error) {
       console.log("Response Error (This is usually a good thing since it proves the key is active!):", data.error);
    } else {
       console.log("✅ SUCCESS: API Key is fully valid and email was sent!", data);
    }
  } catch (error: any) {
    console.log("Caught Error:", error.message);
  }
}

testResend();
