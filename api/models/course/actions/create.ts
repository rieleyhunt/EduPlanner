import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossUserDataAccess } from "gadget-server/auth";
import { extractTextFromPdf } from "../../../utils/pdfExtractor";
import { analyzeWithGemini, extractCourseworkFromSyllabus } from "../../../utils/geminiClient";
import { summarizeCourseContent } from "../../../utils/gptClient";

interface CourseworkItem {
  name: string;
  type: string;
  category: string;
  weight: number;
  date: Date | null;
  description: string;
}

interface CourseworkCategories {
  assignments: CourseworkItem[];
  exams: CourseworkItem[];
  projects: CourseworkItem[];
  quizzes: CourseworkItem[];
}

export const run: ActionRun = async ({ params, record, logger, api, connections, config }) => {
  applyParams(params, record);
  await preventCrossUserDataAccess(params, record);
  
  // Initialize coursework and courseworkCategories
  record.coursework = [];
  record.courseworkCategories = {
    assignments: [],
    exams: [],
    projects: [],
    quizzes: []
  };
  
  // Check if a syllabus file was uploaded
  if (record.syllabus) {
    try {
      // Extract text from the uploaded PDF file
      const extractedText = await extractTextFromPdf(record.syllabus);
      logger.info("Successfully extracted text from PDF syllabus");
      
      // Extract course description from syllabus text
      try {
        logger.info("Extracting course description from syllabus");
        const descriptionPrompt = `
        You are an education assistant. Extract the official course description from this syllabus.
        
        Focus specifically on finding the description that appears near the beginning of the document, immediately after the course title/heading.
        The course description is typically:
        - A concise paragraph or two that appears at the top of the syllabus
        - Located right after the course title, code, instructor information
        - Provides a brief overview of what the course covers
        
        Only return the official description paragraph(s), not any related content such as:
        - Learning objectives
        - Course goals
        - Prerequisites
        - Assessment information
        - Other sections that might follow the description
        
        Return only the clean text description, with no extra commentary or labels.
        If you're uncertain, choose the most concise 1-3 paragraphs that directly describe what the course is about.
        
        Here's the syllabus to analyze:
        ${extractedText}`;
        
        const descriptionResponse = await analyzeWithGemini(descriptionPrompt);
        const extractedDescription = descriptionResponse.result.trim();
        
        // Check if we found a description and update the record accordingly
        if (extractedDescription) {
          logger.info("Successfully extracted course description from syllabus");
          
          if (record.description) {
            // If the course already has a description, append the extracted description
            logger.info("Appending extracted description to existing course description");
            record.description = `${record.description}\n\n--- Course Description from Syllabus ---\n\n${extractedDescription}`;
          } else {
            // If the course doesn't have a description, use the extracted description
            logger.info("Using extracted description as course description");
            record.description = extractedDescription;
          }
        } else {
          logger.warn("No clear course description found in syllabus");
        }
      } catch (descriptionError) {
        logger.error("Error extracting course description from syllabus", {
          error: descriptionError instanceof Error ? descriptionError.message : String(descriptionError),
          courseId: record.id,
          courseName: record.name
        });
        // Continue with creation even if description extraction fails
      }
      
      try {
        // Send the extracted text to Gemini for analysis of assignments and dates
        logger.info("Analyzing syllabus content with Gemini for assignments and dates");
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
        const currentDescription = record.description || "";
        const formattedDescription = `${currentDescription}\n\n--- AI-Analyzed Key Dates & Assignments ---\n\n${geminiResponse.result}\n\n--- Original Syllabus Content ---\n\n${extractedText}`;
        
        record.description = formattedDescription;
        
        logger.info("Successfully analyzed syllabus with Gemini and formatted results");
        
        // Extract coursework items from syllabus
        try {
          logger.info("Extracting coursework items from syllabus");
          
          const courseworkData = await extractCourseworkFromSyllabus(extractedText);
          
          if (courseworkData) {
            // Process coursework data and map to categories
            const processedCoursework: CourseworkItem[] = [];
            const categoryMap = {
              assignments: "assignments",
              homework: "assignments",
              assignment: "assignments",
              exams: "exams",
              exam: "exams",
              test: "exams",
              tests: "exams",
              midterm: "exams", 
              midterms: "exams",
              final: "exams",
              finals: "exams",
              projects: "projects",
              project: "projects",
              quizzes: "quizzes",
              quiz: "quizzes",
              tutorials: "assignments",
              tutorial: "assignments",
              participation: "assignments"
            };
            
            // Initialize processed categories
            const processedCategories: CourseworkCategories = {
              assignments: [] as CourseworkItem[],
              exams: [] as CourseworkItem[],
              projects: [] as CourseworkItem[],
              quizzes: [] as CourseworkItem[]
            };
            
            // Track what we found for logging
            const foundCategories: string[] = [];
            let totalItems = 0;
            
            // Process each category from courseworkData
            const categoriesToProcess = [
              "assignments", 
              "quizzes", 
              "tests", 
              "midterms", 
              "finals", 
              "projects", 
              "tutorials", 
              "participation"
            ];
            
            categoriesToProcess.forEach(categoryKey => {
              // Check if this category exists in courseworkData
              if (!courseworkData[categoryKey]) return;
              
              const items = courseworkData[categoryKey];
              
              if (Array.isArray(items) && items.length > 0) {
                foundCategories.push(`${categoryKey}: ${items.length}`);
                totalItems += items.length;
                
                items.forEach(item => {
                  // Ensure each item has required properties and normalize structure
                  if (item && item.name) {
                    // Determine category and normalize it
                    const originalCategory = categoryKey.toLowerCase();
                    const mappedCategory = categoryMap[originalCategory] || "assignments"; // Default to assignments
                    
                    // Create a normalized item
                    const normalizedItem = {
                      name: item.name,
                      type: originalCategory,
                      category: mappedCategory,
                      weight: typeof item.weight === 'number' ? item.weight : 
                             typeof item.weight === 'string' ? parseFloat(item.weight) || 0 : 0,
                      date: item.date ? new Date(item.date) : null,
                      description: item.description || ""
                    };
                    
                    // Add to overall coursework array
                    processedCoursework.push(normalizedItem);
                    
                    // Add to appropriate category
                    if (processedCategories[mappedCategory]) {
                      processedCategories[mappedCategory].push(normalizedItem);
                    }
                  }
                });
              }
            });
            
            // Update record with processed data, ensuring JSON compatibility
            record.coursework = JSON.parse(JSON.stringify(processedCoursework));
            record.courseworkCategories = JSON.parse(JSON.stringify(processedCategories));
            
            if (totalItems > 0) {
              logger.info("Successfully extracted and processed coursework items", {
                totalItems,
                categoriesFound: foundCategories.join(', '),
                processedCategories: Object.keys(processedCategories).map(key => 
                  `${key}: ${processedCategories[key].length}`
                ).join(', ')
              });
            } else {
              logger.warn("No coursework items found in syllabus");
            }
          } else {
            logger.warn("Invalid response format from coursework extraction");
          }
        } catch (courseworkError) {
          logger.error("Error extracting coursework items from syllabus", {
            error: courseworkError instanceof Error ? courseworkError.message : String(courseworkError),
            courseId: record.id,
            courseName: record.name
          });
          // Continue with creation even if coursework extraction fails
        }
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
  
  // Generate AI summary from course description if available
  if (record.description) {
    try {
      logger.info("Generating course summary with GPT");
      
      const summary = await summarizeCourseContent(record.description);
      record.aiSummary = summary;
      
      logger.info("Successfully generated GPT AI summary for course");
    } catch (summaryError) {
      const errorMsg = summaryError instanceof Error ? summaryError.message : String(summaryError);
      logger.error("Error generating GPT AI summary for course", {
        error: errorMsg,
        courseId: record.id,
        courseName: record.name
      });
      
      // Check if the error is related to missing API key
      if (errorMsg.includes("API key") || errorMsg.includes("authentication")) {
        logger.warn("Missing or invalid OpenAI API key - using fallback summary");
        record.aiSummary = "Course summary could not be generated. Please check your OpenAI API configuration.";
      }
      // Don't prevent creation if summary generation fails
    }
  } else {
    logger.debug("No description available for generating AI summary");
  }
  
  await save(record);
};

export const options: ActionOptions = {
  actionType: "create",
};