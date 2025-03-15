import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossUserDataAccess } from "gadget-server/auth";
import { extractTextFromPdf } from "../../../utils/pdfExtractor";

export const run: ActionRun = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossUserDataAccess(params, record);
  
  // Check if a syllabus file was uploaded
  if (record.syllabus) {
    try {
      // Extract text from the uploaded PDF file
      const extractedText = await extractTextFromPdf(record.syllabus);
      
      // Append the extracted text to the description field
      if (record.description) {
        record.description = `${record.description}\n\n--- Extracted Syllabus Content ---\n\n${extractedText}`;
      } else {
        record.description = extractedText;
      }
      
      logger.info("Successfully extracted text from PDF syllabus and added to description");
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
  
  await save(record);
};

export const options: ActionOptions = {
  actionType: "create",
};