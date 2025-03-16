import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from "@google/generative-ai";
import { logger } from "gadget-server";

// Define TypeScript interfaces for the response data
interface Assignment {
  title: string;
  dueDate: string;
  description?: string;
  weight?: string;
}

interface Test {
  title: string;
  date: string;
  topics?: string[];
  weight?: string;
}

interface SyllabusExtractResult {
  assignments: Assignment[];
  tests: Test[];
  error?: string;
}

// Initialize the Gemini AI client
const initGeminiClient = (): GenerativeModel | null => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      logger.error("Gemini API key not found in environment variables");
      return null;
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Configure the model
    const generationConfig: GenerationConfig = {
      temperature: 0.2, // Lower temperature for more deterministic results
      topK: 32,
      topP: 0.95,
    };
    
    // Initialize the model - using gemini-pro which is suited for text tasks
    return genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig 
    });
    
  } catch (error) {
    logger.error({ error }, "Error initializing Gemini client");
    return null;
  }
};

// Main function to extract tests and assignments from syllabus text
export async function processSyllabusWithGemini(syllabusText: string): Promise<SyllabusExtractResult> {
  try {
    const model = initGeminiClient();
    
    if (!model) {
      return {
        assignments: [],
        tests: [],
        error: "Failed to initialize Gemini client"
      };
    }
    
    // Create a prompt that asks the model to extract structured information
    const prompt = `
    Analyze the following course syllabus text and extract all information about upcoming assignments and tests/exams.
    
    For each assignment, provide:
    - Title
    - Due date
    - Description (if available)
    - Weight/percentage of final grade (if specified)
    
    For each test or exam, provide:
    - Title
    - Date
    - Topics covered (if specified)
    - Weight/percentage of final grade (if specified)
    
    Format your response as a JSON object with two arrays: "assignments" and "tests".
    
    Here is the syllabus text:
    ${syllabusText}
    `;

    // Generate a response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    // The model should return JSON, but sometimes it includes explanatory text
    let jsonStr = text;
    
    // Try to extract just the JSON object if there's additional text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    // Parse the JSON
    try {
      const parsed = JSON.parse(jsonStr) as SyllabusExtractResult;
      return {
        assignments: parsed.assignments || [],
        tests: parsed.tests || []
      };
    } catch (parseError) {
      logger.error({ error: parseError }, "Failed to parse Gemini response as JSON");
      return {
        assignments: [],
        tests: [],
        error: "Failed to parse response data"
      };
    }
    
  } catch (error) {
    logger.error({ error }, "Error processing syllabus with Gemini");
    return {
      assignments: [],
      tests: [],
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

// Helper function to detect if the text is too long for the model
export function checkTextLength(text: string): { isValid: boolean; message?: string } {
  // Gemini has a token limit (~30k tokens), which is roughly 100k characters
  // Being conservative with the limit to avoid issues
  const MAX_CHARS = 80000;
  
  if (text.length > MAX_CHARS) {
    return {
      isValid: false,
      message: `Text is too long (${text.length} characters). Please reduce to under ${MAX_CHARS} characters.`
    };
  }
  
  return { isValid: true };
}

export default {
  processSyllabusWithGemini,
  checkTextLength
};