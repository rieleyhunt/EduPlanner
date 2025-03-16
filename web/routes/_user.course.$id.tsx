import { useFindOne, useAction } from "@gadgetinc/react";
import { api } from "../api";
import { useParams, Link, useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, BookOpen, MessageSquare, Pencil, ArrowLeft, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AutoForm, AutoInput, AutoSubmit } from "@/components/auto";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [{ data: course, fetching, error }] = useFindOne(api.course, id as string, {
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      startDate: true,
      endDate: true,
      color: true,
      user: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    }
  });
  
  const [{ fetching: deleting, error: deleteError }, deleteCourse] = useAction(api.course.delete);

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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/course/${course.id}/edit`)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit Course
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(true)}
              className="gap-2 text-red-500 hover:text-red-500 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
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
              <p className="text-muted-foreground">No materials have been added to this course yet.</p>
              {/* This would be populated with actual course materials */}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this course? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={async () => {
                if (course) {
                  await deleteCourse({ id: course.id });
                  setIsDeleteDialogOpen(false);
                  navigate("/");
                }
              }}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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