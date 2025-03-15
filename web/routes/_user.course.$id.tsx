import { useFindOne, useAction } from "@gadgetinc/react";
import { api } from "../api";
import { useParams, Link, useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, BookOpen, MessageSquare, Pencil, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AutoForm, AutoInput, AutoSubmit } from "@/components/auto";
import { Download, Upload } from "lucide-react";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [{ data: course, fetching, error }] = useFindOne(api.course, id as string, {
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      startDate: true,
      endDate: true,
      color: true,
      syllabus: {
        url: true,
        fileName: true,
        mimeType: true,
        byteSize: true
      },
      syllabusText: true,
      user: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    }
  });

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error.message || "There was an error loading this course. It may not exist or you may not have permission to view it."}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="container mx-auto py-10">
        <div className="space-y-4">
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-4 w-[300px]" />
          <div className="flex gap-4 mt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Skeleton className="h-48 w-full mt-6" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto py-10">
        <Alert>
          <AlertTitle>Course not found</AlertTitle>
          <AlertDescription>
            The course you're looking for doesn't exist or you don't have permission to view it.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Format dates for display
  const startDateFormatted = course.startDate ? format(new Date(course.startDate), "MMMM d, yyyy") : "Not set";
  const endDateFormatted = course.endDate ? format(new Date(course.endDate), "MMMM d, yyyy") : "Not set";

  // Function to generate AI summary from syllabus text
  const generateAISummary = (text: string) => {
    if (!text) return null;
    
    // This is a simulated AI summary function that extracts assignments and tests
    const lines = text.split('\n');
    const assignments: {name: string, dueDate: string}[] = [];
    const tests: {name: string, date: string}[] = [];
    
    // Simple parsing to extract assignments and tests
    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      // Look for assignment patterns
      if (lowerLine.includes('assignment') || lowerLine.includes('homework') || lowerLine.includes('project')) {
        const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\/\d{1,2}|\w+ \d{1,2}(st|nd|rd|th)?)/i);
        const dueDate = dateMatch ? dateMatch[0] : 'TBD';
        const name = line.replace(dateMatch ? dateMatch[0] : '', '').trim();
        assignments.push({ name, dueDate });
      }
      // Look for test patterns
      else if (lowerLine.includes('exam') || lowerLine.includes('test') || lowerLine.includes('quiz') || lowerLine.includes('midterm') || lowerLine.includes('final')) {
        const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\/\d{1,2}|\w+ \d{1,2}(st|nd|rd|th)?)/i);
        const date = dateMatch ? dateMatch[0] : 'TBD';
        const name = line.replace(dateMatch ? dateMatch[0] : '', '').trim();
        tests.push({ name, date });
      }
    });
    
    return { assignments, tests };
  };
  
  // Generate summaries if syllabusText exists
  const aiSummary = course?.syllabusText ? generateAISummary(course.syllabusText) : null;
  const courseSummary = course?.syllabusText ? generateCourseSummary(course.syllabusText) : null;
  
  // Function to generate AI summary of course content, topics, and learning objectives
  function generateCourseSummary(text: string) {
    if (!text) return null;
    
    // Parse text to extract course content, topics and learning objectives
    const lines = text.split('\n');
    const topics: string[] = [];
    const objectives: string[] = [];
    let courseOverview = "";
    
    // Extract course overview (first substantial paragraph)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > 100) {
        courseOverview = lines[i];
        break;
      } else if (i < 10 && lines[i].length > 50) {
        courseOverview = lines[i];
        break;
      }
    }
    
    // Extract topics and learning objectives
    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      // Look for topic patterns
      if (
        (lowerLine.includes('topic') || lowerLine.includes('module') || lowerLine.includes('unit') || lowerLine.includes('week')) && 
        line.length < 100 && 
        line.length > 10
      ) {
        const cleanedTopic = line.replace(/^[-•*\d.\s]+(Topic|Module|Unit|Week)[s]?[\d.\s:]+/i, '').trim();
        if (cleanedTopic && !topics.includes(cleanedTopic)) {
          topics.push(cleanedTopic);
        }
      }
      
      // Look for learning objective patterns
      if (
        (lowerLine.includes('objective') || lowerLine.includes('goal') || lowerLine.includes('outcome') || lowerLine.includes('learn')) && 
        line.length < 150 && 
        line.length > 15
      ) {
        const cleanedObjective = line.replace(/^[-•*\d.\s]+(Objective|Goal|Outcome)[s]?[\d.\s:]+/i, '').trim();
        if (cleanedObjective && !objectives.includes(cleanedObjective)) {
          objectives.push(cleanedObjective);
        }
      }
    });
    
    // Limit to most relevant items
    const limitedTopics = topics.slice(0, 5);
    const limitedObjectives = objectives.slice(0, 4);
    
    return {
      overview: courseOverview || "Course overview not available in syllabus.",
      topics: limitedTopics,
      objectives: limitedObjectives
    };
  }
  return (
    <div className="container mx-auto py-10">
      {/* Course Header */}
      <div 
        className="rounded-lg p-6 mb-6" 
        style={{ 
          backgroundColor: course.color ? course.color : "#f3f4f6",
          color: course.color ? getContrastColor(course.color) : "black" 
        }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{course.name}</h1>
            <div className="flex items-center mt-2">
              <div className="text-sm">
                <CalendarIcon className="inline mr-1 h-4 w-4" /> 
                {startDateFormatted} - {endDateFormatted}
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate(`/course/${course.id}/edit`)}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit Course
          </Button>
        </div>
      </div>

      {/* Course Description */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Course Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {course.description ? (
            <p>{course.description}</p>
          ) : (
            <p className="text-muted-foreground italic">No description available</p>
          )}
        </CardContent>
      </Card>

      {/* Course Content Tabs */}
      <Tabs defaultValue="materials" className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="materials">
            <BookOpen className="h-4 w-4 mr-2" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="ai-assistant">
            <MessageSquare className="h-4 w-4 mr-2" />
            AI Assistant
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Course Materials</CardTitle>
              <CardDescription>Access readings, assignments, and resources</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Syllabus section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Syllabus</h3>
                {course.syllabus?.url ? (
                  <div className="border rounded-md p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{course.syllabus.fileName || 'Course Syllabus'}</p>
                      <p className="text-sm text-muted-foreground">
                        {course.syllabus.mimeType} {course.syllabus.byteSize ? `(${Math.round(course.syllabus.byteSize / 1024)} KB)` : ''}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(course.syllabus?.url, '_blank')}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-md p-4 bg-muted/50">
                    <p className="text-muted-foreground mb-2">No syllabus has been uploaded for this course yet.</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/course/${course.id}/edit`)}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Syllabus
                    </Button>
                  </div>
                )}
              </div>
              
              {/* AI-generated summary */}
              {aiSummary ? (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">AI-Generated Summary of Important Dates</h3>
                  <div className="border rounded-md p-4">
                    {aiSummary.assignments.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Upcoming Assignments</h4>
                        <ul className="space-y-2">
                          {aiSummary.assignments.map((assignment, index) => (
                            <li key={index} className="flex justify-between border-b pb-2">
                              <span>{assignment.name}</span>
                              <Badge variant="outline">{assignment.dueDate}</Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {aiSummary.tests.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Upcoming Tests and Exams</h4>
                        <ul className="space-y-2">
                          {aiSummary.tests.map((test, index) => (
                            <li key={index} className="flex justify-between border-b pb-2">
                              <span>{test.name}</span>
                              <Badge variant="outline">{test.date}</Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {aiSummary.assignments.length === 0 && aiSummary.tests.length === 0 && (
                      <p className="text-muted-foreground">No assignments or tests were found in the syllabus.</p>
                    )}
                    
                    <p className="text-sm text-muted-foreground mt-4">
                      This is an AI-generated summary based on your course syllabus. Please refer to the actual syllabus for complete details.
                    </p>
                  </div>
                </div>
              ) : (
                !course.syllabus?.url && (
                  <div className="mb-6">
                    <Alert className="bg-muted/50">
                      <AlertTitle>No course materials available</AlertTitle>
                      <AlertDescription>
                        Upload a syllabus to see an AI-generated summary of important dates and course materials.
                      </AlertDescription>
                    </Alert>
                  </div>
                )
              )}
              
              {/* Additional course materials would go here */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Additional Resources</h3>
                {courseSummary ? (
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">AI Course Summary</h4>
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-muted-foreground">Overview</h5>
                      <p className="mb-3">{courseSummary.overview}</p>
                    </div>
                    
                    {courseSummary.topics.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-muted-foreground">Main Topics</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          {courseSummary.topics.map((topic, index) => (
                            <li key={index}>{topic}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {courseSummary.objectives.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-muted-foreground">Learning Objectives</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          {courseSummary.objectives.map((objective, index) => (
                            <li key={index}>{objective}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground mt-4">
                      This is an AI-generated summary of course content based on your syllabus. It represents a computer-generated interpretation of the syllabus content and may not be complete or fully accurate.
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No additional materials have been added to this course yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Course Schedule</CardTitle>
              <CardDescription>Class sessions and important dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4">
                <p className="text-muted-foreground">No schedule information is available yet.</p>
                {/* This would show a calendar or list of course dates/events */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai-assistant">
          <Card>
            <CardHeader>
              <CardTitle>AI Course Assistant</CardTitle>
              <CardDescription>Get help with course concepts and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 mb-4 h-[300px] overflow-y-auto">
                <p className="text-muted-foreground">AI chat history will appear here.</p>
                {/* This would show the chat history */}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ask a question about this course..." 
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <Button>Send</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Back button */}
      <div className="mt-6">
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
        </Button>
      </div>
    </div>
  );
}

// Helper function to determine if text should be light or dark based on background color
function getContrastColor(hexColor: string) {
  // Remove the # if it exists
  hexColor = hexColor.replace("#", "");
  
  // Convert to RGB values
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? "#000000" : "#ffffff";
}