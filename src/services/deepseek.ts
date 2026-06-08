import crypto from "crypto";

/**
 * Intelligent local mock responder simulating DeepSeek API answers for all study features.
 */
function generateMockCompletion(systemPrompt: string, userPrompt: string): string {
  const lowerUser = userPrompt.toLowerCase();
  const lowerSystem = systemPrompt.toLowerCase();

  // Flashcards prompt match
  if (lowerUser.includes("flashcard") || lowerSystem.includes("flashcard")) {
    return JSON.stringify([
      {
        front: "What is the primary light-absorbing pigment in green plants?",
        back: "Chlorophyll, specifically chlorophyll a and b, which absorb red and blue wavelengths of light.",
      },
      {
        front: "Describe the primary role of the Calvin Cycle.",
        back: "To fix carbon dioxide from the atmosphere into organic molecules like G3P/glucose using ATP and NADPH energy.",
      },
      {
        front: "Where do the light-dependent reactions take place?",
        back: "Inside the thylakoid membranes of chloroplasts, where chlorophyll is organized into photosystems.",
      }
    ]);
  }

  // Quiz generation match
  if (lowerUser.includes("quiz") || lowerSystem.includes("quiz")) {
    return JSON.stringify([
      {
        id: "q1",
        type: "mcq",
        question: "Which of the following is produced during the light-dependent reactions of photosynthesis?",
        options: ["Glucose", "Carbon Dioxide", "Oxygen", "Water"],
        answer: "Oxygen",
        explanation: "Oxygen is produced when water molecules are split during photolysis in photosystem II.",
      },
      {
        id: "q2",
        type: "shortAnswer",
        question: "In which specific structure of the chloroplast does the Calvin Cycle occur?",
        answer: "Stroma",
        explanation: "The Calvin cycle occurs in the stroma, which is the fluid surrounding the thylakoid membranes.",
      },
      {
        id: "q3",
        type: "theory",
        question: "Explain why plants appear green to the human eye in terms of light absorption.",
        answer: "Chlorophyll pigments absorb light in the blue-violet and red wavelengths, but reflect green light, which is captured by our eyes.",
        explanation: "Rubric check: Verify mention of blue/red light absorption and green light reflection."
      }
    ]);
  }

  // Quiz evaluation match
  if (lowerUser.includes("evaluation") || lowerSystem.includes("evaluation")) {
    return JSON.stringify({
      score: 2,
      percentage: 66,
      grade: "C",
      answers: [
        {
          questionId: "q1",
          userAnswer: "Oxygen",
          correctAnswer: "Oxygen",
          correct: true,
          explanation: "Correct! Oxygen is released as a byproduct of photolysis.",
        },
        {
          questionId: "q2",
          userAnswer: "Thylakoid",
          correctAnswer: "Stroma",
          correct: false,
          explanation: "Incorrect. Thylakoids host the light reactions. The Calvin cycle occurs in the stroma.",
        },
        {
          questionId: "q3",
          userAnswer: "Because chlorophyll reflects green light.",
          correctAnswer: "Chlorophyll absorbs blue and red wavelengths of light but reflects green wavelength light.",
          correct: true,
          scoreFraction: 0.8,
          explanation: "Good answer. Correctly noted reflection of green light. For full marks, mention the absorption of red and blue light.",
        }
      ],
      weakTopics: ["Calvin Cycle Locations", "Light Spectrum Absorption"],
      recommendations: ["Review chloroplast anatomy (stroma vs thylakoid)", "Study pigments reflection spectrums"],
    });
  }

  // Study room AI Review Mode match
  if (lowerUser.includes("review") || lowerSystem.includes("review")) {
    return JSON.stringify({
      score: 8,
      strengths: [
        "Correctly identified stroma location.",
        "Accurately associated CO2 fixation with carbon compounds production."
      ],
      missingConcepts: [
        "Failed to state the consumption of light reaction products (ATP and NADPH)."
      ],
      improvements: [
        "Connect carbon fixation energy requirements directly to light reaction outputs."
      ],
      modelAnswer: "The light-independent reactions (Calvin cycle) take place in the stroma of the chloroplast. Here, carbon dioxide is captured and fixed into G3P sugars using energy carriers (ATP and NADPH) generated in the light reactions.",
    });
  }

  // Default: Summary mock
  let summaryType = "Summary";
  if (lowerUser.includes("short")) summaryType = "Short Summary";
  else if (lowerUser.includes("detailed")) summaryType = "Detailed Summary";
  else if (lowerUser.includes("revision")) summaryType = "Revision Notes";
  else if (lowerUser.includes("keyconcepts") || lowerUser.includes("key concepts")) summaryType = "Key Concepts";
  else if (lowerUser.includes("examprep") || lowerUser.includes("exam prep")) summaryType = "Exam Prep Summary";

  return `
# ${summaryType}: Photosynthesis Study Guide

Photosynthesis represents the chemical process where light energy is converted to chemical energy stored in sugars.

## Core Concepts
* **Equation:** 6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂.
* **Light Reactions:** Capture solar energy in the thylakoid membranes, yielding O₂ (byproduct), ATP, and NADPH.
* **Calvin Cycle:** Occurs in the stroma. Synthesizes G3P sugar utilizing ATP and NADPH to reduce CO₂.

## High-Yield Revision Areas
1. **Chlorophyll Functions:** Principal pigment absorbing blue/red light and reflecting green.
2. **Key Enzyme:** Rubisco catalyzes the initial carbon fixation step in the Calvin cycle.
3. **Storage:** Synthesized sugars are converted into starch for long-term plant energy reserves.
  `;
}

/**
 * Executes chat completion queries against the DeepSeek API.
 */
export async function queryDeepSeek(systemPrompt: string, userPrompt: string, temperature = 0.3): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey || apiKey.includes("your_deepseek_api_key")) {
    console.warn("DEEPSEEK_API_KEY is unconfigured. Generating localized mock completion.");
    return generateMockCompletion(systemPrompt, userPrompt);
  }

  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
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
        temperature,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`DeepSeek API error ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error: any) {
    console.error("DeepSeek service query failed:", error);
    throw new Error(error.message || "AI Service Unavailable. Please try again later.");
  }
}
