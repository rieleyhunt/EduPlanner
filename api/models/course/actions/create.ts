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
      // Store the extracted text in the syllabusText field
      record.syllabusText = extractedText;
      logger.info("Successfully extracted text from PDF syllabus");
    } catch (error) {
      logger.error("Error extracting text from PDF syllabus", { error });
      // Don't prevent creation if text extraction fails
    }
  }
  
  await save(record);
};

export const options: ActionOptions = {
  actionType: "create",
};