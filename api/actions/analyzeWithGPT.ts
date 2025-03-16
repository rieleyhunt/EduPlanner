import { ActionOptions } from "gadget-server";
import { analyzeText } from "../utils/geminiClient";
import { extractTextFromPdf } from "../utils/pdfExtractor";

export const run: ActionRun = async ({ params, logger, api, session }) => {
  const { type, courseId, question, content } = params;
  
  // Get user ID for tenancy
  const userId = session?.get("user");
  let result;
  
  if (type === "deadlines") {
    // Extract deadlines from course description
    if (courseId) {
      const course = await api.course.findOne(courseId, {
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          startDate: true,
          endDate: true
        }
      });
      
      // Ensure user has access to this course (tenancy)
      if (course.userId !== userId) {
        throw new Error("You don't have access to this course");
      }
      
      const prompt = `Extract all deadlines and important dates from the following course description. 
      Format the response as a JSON array of objects with date and description properties.
      Course: ${course.code} - ${course.name}
      Description: ${course.description}
      Course starts: ${course.startDate}
      Course ends: ${course.endDate}`;
      
      result = await analyzeText(prompt);
    } else if (content) {
      // Use provided content instead of fetching course data
      const prompt = `Extract all deadlines and important dates from the following text. 
      Format the response as a JSON array of objects with date and description properties.
      Content: ${content}`;
      
      result = await analyzeText(prompt);
    } else {
      throw new Error("Either courseId or content must be provided");
    }
  } else if (type === "syllabus") {
    // Analyze syllabus content
    if (!courseId) {
      throw new Error("Course ID is required for syllabus analysis");
    }
    
    const course = await api.course.findOne(courseId, {
      select: {
        id: true,
        name: true,
        code: true,
        syllabus: {
          url: true
        },
        userId: true
      }
    });
    
    // Ensure user has access to this course
    if (course.userId !== userId) {
      throw new Error("You don't have access to this course");
    }
    
    if (!course.syllabus || !course.syllabus.url) {
      throw new Error("This course doesn't have a syllabus uploaded");
    }
    
    // Extract text from syllabus PDF
    const syllabusText = await extractTextFromPdf(course.syllabus.url);
    
    const prompt = `Analyze the following course syllabus and provide a summary of the key information including:
    - Course objectives
    - Grading criteria
    - Required materials
    - Weekly schedule
    - Major assignments or projects
    
    Format the response in a well-structured way.
    
    Course: ${course.code} - ${course.name}
    Syllabus content: ${syllabusText}`;
    
    result = await analyzeText(prompt);
  } else if (type === "summary") {
    // Generate a comprehensive course summary
    if (!courseId && !content) {
      throw new Error("Either courseId or content must be provided for summary analysis");
    }
    
    if (courseId) {
      const course = await api.course.findOne(courseId, {
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          startDate: true,
          endDate: true,
          userId: true,
          syllabus: {
            url: true
          }
        }
      });
      
      // Ensure user has access to this course
      if (course.userId !== userId) {
        throw new Error("You don't have access to this course");
      }
      
      let courseContent = `Course: ${course.code} - ${course.name}
      Description: ${course.description}
      Start date: ${course.startDate}
      End date: ${course.endDate}`;
      
      // Add syllabus content if available for a more comprehensive analysis
      if (course.syllabus && course.syllabus.url) {
        const syllabusText = await extractTextFromPdf(course.syllabus.url);
        courseContent += `\nSyllabus content: ${syllabusText}`;
      }
      
      const prompt = `Generate a comprehensive summary of the following course. Include:
      1. An overview of the main course content
      2. Key learning objectives
      3. Main topics/subjects covered
      4. Skills students will develop
      5. Any notable teaching methods or approaches mentioned
      
      Format the response in a well-structured way with sections and bullet points where appropriate.
      
      ${courseContent}`;
      
      result = await analyzeText(prompt);
    } else if (content) {
      // Use provided content instead of fetching course data
      const prompt = `Generate a comprehensive summary of the following course content. Include:
      1. An overview of the main course content
      2. Key learning objectives
      3. Main topics/subjects covered
      4. Skills students will develop
      5. Any notable teaching methods or approaches mentioned
      
      Format the response in a well-structured way with sections and bullet points where appropriate.
      
      ${content}`;
      
      result = await analyzeText(prompt);
    }
  } else if (type === "question") {
    // Answer student question about a course
    if (!question) {
      throw new Error("Question is required");
    }
    
    let courseContext = "";
    
    if (courseId) {
      const course = await api.course.findOne(courseId, {
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          startDate: true,
          endDate: true,
          userId: true,
          syllabus: {
            url: true
          }
        }
      });
      
      // Ensure user has access to this course
      if (course.userId !== userId) {
        throw new Error("You don't have access to this course");
      }
      
      courseContext = `Course: ${course.code} - ${course.name}
      Description: ${course.description}
      Start date: ${course.startDate}
      End date: ${course.endDate}`;
      
      // Add syllabus content if available
      if (course.syllabus && course.syllabus.url) {
        const syllabusText = await extractTextFromPdf(course.syllabus.url);
        courseContext += `\nSyllabus content: ${syllabusText}`;
      }
    } else if (content) {
      courseContext = content;
    } else {
      // If no specific course, get all user's courses for context
      const courses = await api.course.findMany({
        filter: {
          userId: { equals: userId }
        },
        select: {
          id: true,
          name: true,
          code: true,
          description: true
        }
      });
      
      courseContext = "Your courses:\n" + 
        courses.map(c => `${c.code} - ${c.name}: ${c.description}`).join("\n\n");
    }
    
    const prompt = `As an educational assistant, please answer the following question from a student.
    Use the provided course information to give a relevant and helpful response.
    
    ${courseContext}
    
    Student question: ${question}`;
    
    result = await analyzeText(prompt);
  } else {
    throw new Error("Invalid analysis type. Valid types are: deadlines, syllabus, question, summary");
  }
  
  return result;
};

export const params = {
  type: {
    type: "string",
  },
  courseId: {
    type: "string"
  },
  question: {
    type: "string"
  },
  content: {
    type: "string"
  }
};

export const options: ActionOptions = {
  // Keep default api trigger
};