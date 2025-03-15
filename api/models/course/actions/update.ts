import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossUserDataAccess } from "gadget-server/auth";
import { extractTextFromPdf } from "../../../utils/pdfExtractor";

export const run: ActionRun = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossUserDataAccess(params, record);
  
  // Check if a new syllabus file was uploaded
  const syllabusChange = record.changes("syllabus");
  if (syllabusChange?.changed && record.syllabus) {
    try {
      // Extract text from the PDF file
      const extractedText = await extractTextFromPdf(record.syllabus);
      // Update the syllabusText field with the extracted text
      record.syllabusText = extractedText;
    } catch (error) {
      logger.error("Failed to extract text from syllabus PDF", { error });
    }
  }
  
  await save(record);
};

export const options: ActionOptions = {
  actionType: "update",
};
