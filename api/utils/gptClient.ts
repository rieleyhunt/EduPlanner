import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";

// Define the interface for deadline extraction
const deadlineSchema = z.object({
  title: z.string().describe("The title or name of the deadline/assignment"),
  dueDate: z.string().describe("The due date in YYYY-MM-DD format"),
  description: z.string().describe("A brief description of the deadline/assignment"),
  estimatedHours: z.number().optional().describe("Estimated hours to complete the assignment"),
});

// Define the interface for question analysis results
const questionAnalysisSchema = z.object({
  topic: z.string().describe("The main topic of the question"),
  relatedConcepts: z.array(z.string()).describe("Related concepts that might be helpful"),
  answer: z.string().describe("A concise answer to the student's question"),
  furtherResources: z.array(z.string()).optional().describe("Suggested resources for further learning"),
});

// Type definitions for our responses
type DeadlineExtraction = z.infer<typeof deadlineSchema>;
type QuestionAnalysis = z.infer<typeof questionAnalysisSchema>;

/**
 * Initialize the OpenAI chat model
 * @param apiKey - OpenAI API key
 * @returns ChatOpenAI model instance
 */
const initChatModel = (apiKey: string) => {
  return new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.2,
    openAIApiKey: apiKey,
  });
};

/**
 * Extract deadlines from a course description
 * @param courseDescription - The course description text
 * @param syllabus - Additional syllabus text (optional)
 * @returns Array of extracted deadlines
 */
export async function extractDeadlinesFromText(
  courseDescription: string,
  syllabus?: string
): Promise<DeadlineExtraction[]> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const chatModel = initChatModel(apiKey);
    const deadlineParser = StructuredOutputParser.fromZodSchema(z.array(deadlineSchema));
    const formatInstructions = deadlineParser.getFormatInstructions();

    const prompt = [
      new SystemMessage(
        "You are an AI assistant that extracts deadline information from course descriptions and syllabi. " +
        "Extract all assignments, projects, exams, and other deadlines mentioned in the text. " +
        "If a date is ambiguous, make your best guess at the specific date."
      ),
      new HumanMessage(
        `Extract all deadlines and assignments from the following course information:\n\n` +
        `Course Description: ${courseDescription}\n\n` +
        `${syllabus ? `Syllabus: ${syllabus}\n\n` : ""}` +
        `${formatInstructions}`
      ),
    ];

    const response = await chatModel.invoke(prompt);
    return deadlineParser.parse(response.content);
  } catch (error) {
    console.error("Error extracting deadlines:", error);
    return [];
  }
}

/**
 * Analyze a student's question about their course
 * @param question - The student's question
 * @param courseContext - Contextual information about the course
 * @returns Analysis of the question with helpful information
 */
export async function analyzeStudentQuestion(
  question: string,
  courseContext: string
): Promise<QuestionAnalysis> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const chatModel = initChatModel(apiKey);
    const analysisParser = StructuredOutputParser.fromZodSchema(questionAnalysisSchema);
    const formatInstructions = analysisParser.getFormatInstructions();

    const prompt = [
      new SystemMessage(
        "You are an AI educational assistant that helps students understand their course material. " +
        "Analyze questions, identify the main topics, and provide helpful, accurate responses."
      ),
      new HumanMessage(
        `Please analyze the following student question about their course:\n\n` +
        `Question: ${question}\n\n` +
        `Course Context: ${courseContext}\n\n` +
        `${formatInstructions}`
      ),
    ];

    const response = await chatModel.invoke(prompt);
    return analysisParser.parse(response.text);
  } catch (error) {
    console.error("Error analyzing student question:", error);
    return {
      topic: "Error analyzing question",
      relatedConcepts: [],
      answer: "I encountered an error while analyzing your question. Please try again or rephrase your question.",
    };
  }
}

/**
 * Generate a study plan based on course material and deadlines
 * @param courseDescription - The course description
 * @param deadlines - Array of course deadlines
 * @param studentPreferences - Student's learning preferences and availability
 * @returns A structured study plan
 */
export async function generateStudyPlan(
  courseDescription: string,
  deadlines: DeadlineExtraction[],
  studentPreferences: string
): Promise<string> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const chatModel = initChatModel(apiKey);
    const outputParser = new StringOutputParser();

    const deadlinesText = deadlines.map(d => 
      `- ${d.title}: Due on ${d.dueDate}, ${d.description}${d.estimatedHours ? `, Est. hours: ${d.estimatedHours}` : ''}`
    ).join('\n');

    const prompt = [
      new SystemMessage(
        "You are an AI educational assistant that helps students create effective study plans. " +
        "Create a detailed study plan that breaks down the course material into manageable chunks, " +
        "taking into account the deadlines and student's preferences."
      ),
      new HumanMessage(
        `Please create a study plan for the following course:\n\n` +
        `Course Description: ${courseDescription}\n\n` +
        `Deadlines:\n${deadlinesText}\n\n` +
        `Student Preferences: ${studentPreferences}\n\n` +
        `The study plan should include weekly goals, suggested study sessions, and preparation for each deadline.`
      ),
    ];

    const response = await chatModel.invoke(prompt);
    return outputParser.parse(response.content as string);
  } catch (error) {
    console.error("Error generating study plan:", error);
    return "Error generating study plan. Please try again later.";
  }
}

/**
 * Summarize course material to help with studying
 * @param courseText - The course text to summarize
 * @param maxLength - Maximum length of the summary in characters
 * @returns A concise summary of the course material
 */
export async function summarizeCourseContent(
  courseText: string,
  maxLength: number = 1000
): Promise<string> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const chatModel = initChatModel(apiKey);
    const outputParser = new StringOutputParser();

    const prompt = [
      new SystemMessage(
        "You are an AI educational assistant that excels at creating concise, informative summaries of academic content. " +
        "Focus on key concepts, definitions, and important details."
      ),
      new HumanMessage(
        `Please summarize the following course material in a clear, structured way:\n\n` +
        `${courseText}\n\n` +
        `Keep the summary under ${maxLength} characters. Highlight the most important concepts and organize logically.`
      ),
    ];

    const response = await chatModel.invoke(prompt);
    
    return outputParser.parse(response.content);
  } catch (error) {
    console.error("Error summarizing course content:", error);
    return "Error summarizing course content. Please try again later.";
  }
}