import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossUserDataAccess } from "gadget-server/auth";
import { extractTextFromPdf } from "../../../utils/pdfExtractor";
import { analyzeWithGemini } from "../../../utils/geminiClient";

export const run: ActionRun = async ({ params, record, logger, api, connections, config }) => {
  applyParams(params, record);
  await preventCrossUserDataAccess(params, record);
  
  // Check if a syllabus file was uploaded
  if (record.syllabus) {
    try {
      // Extract text from the uploaded PDF file
      const extractedText = await extractTextFromPdf(record.syllabus);
      logger.info("Successfully extracted text from PDF syllabus");
      
      try {
        // Send the extracted text to Gemini for analysis
        logger.info("Analyzing syllabus content with Gemini");
        const prompt = `
        You are an education assistant. Analyze this syllabus text and extract structured information.
        Please identify and list:
        1. All tests, quizzes, and exams with their dates
        2. All assignments, projects, and homework with their due dates
        3. Any important deadlines or events

        Format your response in markdown, with clear sections and bullet points.
        
        Here's the syllabus to analyze:
        ${extractedText}`;
        
        const geminiResponse = await analyzeWithGemini(prompt);
        
        // Format the description with both extracted text and Gemini analysis
        const formattedDescription = record.description 
          ? `${record.description}\n\n--- AI-Analyzed Key Dates & Assignments ---\n\n${geminiResponse}\n\n--- Original Syllabus Content ---\n\n${extractedText}`
          : `--- AI-Analyzed Key Dates & Assignments ---\n\n${geminiResponse}\n\n--- Original Syllabus Content ---\n\n${extractedText}`;
        
        record.description = formattedDescription;
        
        logger.info("Successfully analyzed syllabus with Gemini and formatted results");
      } catch (geminiError) {
        logger.error("Error analyzing syllabus with Gemini", {
          error: geminiError instanceof Error ? geminiError.message : String(geminiError),
          courseId: record.id,
          courseName: record.name
        });
        
        // If Gemini analysis fails, just use the extracted text
        if (record.description) {
          record.description = `${record.description}\n\n--- Extracted Syllabus Content ---\n\n${extractedText}`;
        } else {
          record.description = extractedText;
        }
        logger.info("Falling back to basic text extraction without Gemini analysis");
      }
    } catch (error) {
      logger.error("Error extracting text from PDF syllabus", { 
        error: error instanceof Error ? error.message : String(error),
        courseId: record.id,
        courseName: record.name
      });
      // Don't prevent creation if text extraction fails
    }
  } else {
    logger.debug("No syllabus file was uploaded with this course");
  }
  
  // Log the full description for debugging purposes
  logger.debug("Full course description before save", { 
    description: record.description,
    courseId: record.id,
    courseName: record.name
  });
  
  await save(record);
};

export const options: ActionOptions = {
  actionType: "create",
};