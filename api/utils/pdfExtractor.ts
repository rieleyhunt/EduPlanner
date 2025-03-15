import pdfParse from 'pdf-parse';
import got from 'got';
import { logger } from 'gadget-server';

/**
 * Extracts text from a PDF file
 * @param file The file object containing the PDF metadata
 * @returns The extracted text as a string, or empty string if extraction fails
 */
export const extractTextFromPdf = async (file: { url: string; mimeType: string }): Promise<string> => {
  try {
    // Check if the file is a PDF based on MIME type
    if (!file || !file.url || file.mimeType !== 'application/pdf') {
      logger.warn('File is not a PDF or missing URL', { mimeType: file?.mimeType });
      return '';
    }

    // Fetch the file content from the URL
    const fileBuffer = await got(file.url).buffer();
    
    // Parse the PDF and extract text
    const pdfData = await pdfParse(fileBuffer);
    
    // Return the extracted text
    return pdfData.text || '';
  } catch (error) {
    // Log the error but don't throw it
    logger.error('Failed to extract text from PDF', { error });
    return '';
  }
};