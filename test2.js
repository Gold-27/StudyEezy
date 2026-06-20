const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf-8');
const apiKeyMatch = envContent.match(/DEEPSEEK_API_KEY=([^\s]+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1] : '';

async function queryDeepSeek(systemPrompt, userPrompt, temperature) {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: temperature || 0.7,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

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
}

test().catch(console.error);
