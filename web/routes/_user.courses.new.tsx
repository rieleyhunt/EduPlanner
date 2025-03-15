import React, { useState } from "react";
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
  const [defaultValues, setDefaultValues] = useState({
    course: {
      code: `COURSE-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`,
      description: ""
    }
  });
  
  // Function to handle PDF text extraction when syllabus is uploaded
  const handleSyllabusUpload = async (file: File | null) => {
    if (!file || !file.type.includes("pdf")) return;
    
    try {
      // For PDF text extraction, we would normally use a library like pdf.js
      // For this implementation, we're simulating the extraction with a simple message
      const extractedText = `Text extracted from ${file.name}`;
      
      // Update the default values with the extracted text
      setDefaultValues(prev => ({
        ...prev,
        course: {
          ...prev.course,
          description: extractedText
        }
      }));
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
            defaultValues={defaultValues}
          >
            <div className="mb-4">
              <AutoInput field="name" />
            </div>

            <AutoInput field="description" />

            <AutoInput field="color" />

            <div className="my-4">
              <AutoFileInput 
                field="syllabus" 
                onChange={(file) => handleSyllabusUpload(file)} 
                accept=".pdf"
              />
              {defaultValues.course.description.startsWith("Text extracted") && (
                <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200">
                  <p className="text-sm font-medium">Extracted Text:</p>
                  <p className="text-sm text-slate-600">{defaultValues.course.description}</p>
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