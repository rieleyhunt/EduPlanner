import { useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../api";
import { 
  AutoForm, 
  AutoInput, 
  AutoFileInput,
  AutoSubmit, 
  SubmitResultBanner 
} from "@/components/auto";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewCourse() {
  const navigate = useNavigate();
  const [pdfText, setPdfText] = useState<string | null>(null);
  
  // Generate a structured course code based on current date
  const today = new Date();
  const courseCode = `COURSE-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  
  // Create properly formatted ISO date strings
  const startDate = new Date().toISOString();
  const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  
  // Function to handle PDF text extraction
  const handleFileUpload = async (file: File) => {
    if (!file || !file.type.includes("pdf")) return;
    
    try {
      // For PDF text extraction, we would normally use a library like pdf.js
      // For this implementation, we're simulating the extraction with a simple message
      // In a real app, you would use a proper PDF parsing library
      setPdfText(`Text extracted from ${file.name}`);
    } catch (error) {
      console.error("Error extracting PDF text:", error);
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center">
        <Button 
          variant="outline" 
          size="sm" 
          className="mr-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Add New Course</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
          <CardDescription>
            Fill in the information below to create a new course.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AutoForm 
            action={api.course.create} 
            onSuccess={(result) => {
              navigate(`/course/${result.id}`);
            }}
            defaultValues={{
              course: {
                syllabusText: pdfText || "",
                code: courseCode,
                startDate: startDate,
                endDate: endDate
              }
            }}
          >
            <div className="mb-4">
              <AutoInput field="name" />
            </div>

            <AutoInput field="description" />

            <AutoInput field="color" />

            <div className="my-4">
              <h3 className="text-sm font-medium mb-2">Upload Syllabus PDF</h3>
              <AutoFileInput 
                field="syllabus" 
                onChange={(event) => {
                  const file = (event.currentTarget as HTMLInputElement)?.files?.[0] || null;
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
              />
              {pdfText && (
                <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200">
                  <p className="text-sm font-medium">Extracted Text:</p>
                  <p className="text-sm text-slate-600">{pdfText}</p>
                </div>
              )}
            </div>
            
            <SubmitResultBanner />
            <div className="mt-4 flex justify-end">
              <AutoSubmit>Create Course</AutoSubmit>
            </div>
          </AutoForm>
        </CardContent>
      </Card>
    </div>
  );
}