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

interface CourseworkItem {
  title: string;
  weight?: string; // Percentage or points
  dueDate?: string;
  description?: string;
}

interface CourseworkExtractResult {
  assignments: CourseworkItem[];
  quizzes: CourseworkItem[];
  tests: CourseworkItem[];
  midterms: CourseworkItem[];
  finals: CourseworkItem[];
  projects: CourseworkItem[];
  tutorials: CourseworkItem[];
  participation: CourseworkItem[];
  other: CourseworkItem[];
  totalWeight?: string; // Sum of all weights if available
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

// General purpose function to analyze text with Gemini AI
export async function analyzeWithGemini(prompt: string): Promise<{ result: string; error?: string }> {
  try {
    const model = initGeminiClient();
    
    if (!model) {
      return {
        result: "",
        error: "Failed to initialize Gemini client"
      };
    }
    
    // Check if the prompt is within the length limit
    const lengthCheck = checkTextLength(prompt);
    if (!lengthCheck.isValid) {
      return {
        result: "",
        error: lengthCheck.message
      };
    }
    
    // Generate a response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return { result: text };
    
  } catch (error) {
    logger.error({ error }, "Error analyzing text with Gemini");
    return {
      result: "",
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

// Simple wrapper for text analysis
export async function analyzeText(text: string, instruction: string = "Analyze the following text:"): Promise<{ result: string; error?: string }> {
  const prompt = `
  ${instruction}
  
  ${text}
  `;
  
  return analyzeWithGemini(prompt);
}

// Function to extract detailed coursework information from a syllabus
export async function extractCourseworkFromSyllabus(syllabusText: string): Promise<CourseworkExtractResult> {
  try {
    const model = initGeminiClient();
    
    if (!model) {
      return {
        assignments: [],
        quizzes: [],
        tests: [],
        midterms: [],
        finals: [],
        projects: [],
        tutorials: [],
        participation: [],
        other: [],
        error: "Failed to initialize Gemini client"
      };
    }
    
    // Check if the text is within length limits
    const lengthCheck = checkTextLength(syllabusText);
    if (!lengthCheck.isValid) {
      return {
        assignments: [],
        quizzes: [],
        tests: [],
        midterms: [],
        finals: [],
        projects: [],
        tutorials: [],
        participation: [],
        other: [],
        error: lengthCheck.message
      };
    }
    
    // Create a detailed prompt for extracting coursework information
    const prompt = `
    Analyze this course syllabus and extract ALL coursework items that contribute to the final grade.
    
    Focus on these sections:
    - Course evaluation/assessment/grading
    - Assignment details
    - Examination information
    - Project requirements
    - Participation/attendance requirements
    
    For EACH coursework item, extract:
    1. Title/name
    2. Weight/percentage of final grade (look for %, percent, percentage, points worth, etc.)
    3. Due date or timeframe if available
    4. Brief description if available
    
    Categorize each item into one of these types:
    - assignments
    - quizzes
    - tests
    - midterms
    - finals
    - projects
    - tutorials
    - participation (includes attendance, discussion boards, etc.)
    - other (anything that doesn't fit above categories)
    
    Calculate the total weight if possible (should sum to 100%).
    
    Format your response as a JSON object with arrays for each category and a totalWeight field.
    
    Syllabus text:
    ${syllabusText}
    `;

    // Generate a response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    let jsonStr = text;
    
    // Try to extract just the JSON object if there's additional text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    // Parse the JSON
    try {
      const parsed = JSON.parse(jsonStr) as CourseworkExtractResult;
      
      // Ensure all arrays exist even if empty
      return {
        assignments: parsed.assignments || [],
        quizzes: parsed.quizzes || [],
        tests: parsed.tests || [],
        midterms: parsed.midterms || [],
        finals: parsed.finals || [],
        projects: parsed.projects || [],
        tutorials: parsed.tutorials || [],
        participation: parsed.participation || [],
        other: parsed.other || [],
        totalWeight: parsed.totalWeight
      };
    } catch (parseError) {
      logger.error({ error: parseError }, "Failed to parse Gemini response as JSON");
      return {
        assignments: [],
        quizzes: [],
        tests: [],
        midterms: [],
        finals: [],
        projects: [],
        tutorials: [],
        participation: [],
        other: [],
        error: "Failed to parse response data"
      };
    }
    
  } catch (error) {
    logger.error({ error }, "Error extracting coursework from syllabus with Gemini");
    return {
      assignments: [],
      quizzes: [],
      tests: [],
      midterms: [],
      finals: [],
      projects: [],
      tutorials: [],
      participation: [],
      other: [],
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

export default {
  processSyllabusWithGemini,
  checkTextLength,
  analyzeWithGemini,
  analyzeText,
  extractCourseworkFromSyllabus
};