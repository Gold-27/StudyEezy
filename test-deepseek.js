const { queryDeepSeek } = require("./src/lib/deepseek");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

async function test() {
    const systemPrompt = `You are the StudyEezy AI Reviewer.
Your role is to evaluate a peer answer submitted in a study room against a specific question.
Do NOT automatically reply to the question yourself. Grade the answer constructively.
Your output must be a valid raw JSON object. Do not include markdown blocks like \`\`\`json. The JSON must exactly match this structure:
{
  "score": number (evaluation score between 1 and 10),
  "strengths": string[] (bullet points of correct concepts explained),
  "missingConcepts": string[] (bullet points of omitted concepts or information),
  "improvements": string[] (bullet points of practical recommendations to improve the response),
  "modelAnswer": string (a short, concise model answer that fully satisfies the question in 2-3 sentences max. Do NOT give long answers. Give only the answer that matters for a student.)
}`;

    const userPrompt = `Evaluate the answer below:
Question: What is photosynthesis?
Peer Answer: It is when plants make food using the sun.`;

    const aiResponse = await queryDeepSeek(systemPrompt, userPrompt, 0.3);
    console.log("RAW RESPONSE:");
    console.log(aiResponse);
    
    const cleanedResponse = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const reviewData = JSON.parse(cleanedResponse);
    console.log("\nPARSED RESPONSE:");
    console.log(reviewData);
}

test().catch(console.error);
