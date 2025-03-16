import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CalendarIcon, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { useOutletContext } from "react-router";
import { useState, useEffect } from "react";
import { useFindMany } from "@gadgetinc/react";
import { api } from "../api";
import type { AuthOutletContext } from "./_user";

export default function () {
  const { gadgetConfig, user } = useOutletContext<AuthOutletContext>();
  
  // State for calendar and deadlines
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [deadlines, setDeadlines] = useState<Array<{
    id: string;
    title: string;
    date: Date;
    course: string;
    courseId: string;
    description?: string;
    color?: string;
    priority?: 'high' | 'medium' | 'low';
  }>>([]);
  const [daysWithDeadlines, setDaysWithDeadlines] = useState<Date[]>([]);
  
  // Fetch user courses
  const [{ data: courses, fetching, error }] = useFindMany(api.course, {
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      code: true,
      startDate: true,
      endDate: true,
    }
  });
  
  // Extract deadlines from course descriptions
  useEffect(() => {
    if (!courses) return;
    
    const extractedDeadlines: typeof deadlines = [];
    
    courses.forEach(course => {
      if (!course.description) return;
      
      // Simple regex to find dates in descriptions (MM/DD/YYYY or Month DD, YYYY)
      const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{4}|[A-Z][a-z]+ \d{1,2},? \d{4})/g;
      const matches = course.description.match(dateRegex) || [];
      
      // Extract small snippets around the dates to get context
      matches.forEach(match => {
        const dateIndex = course.description!.indexOf(match);
        const startIndex = Math.max(0, dateIndex - 50);
        const endIndex = Math.min(course.description!.length, dateIndex + 50);
        const context = course.description!.substring(startIndex, endIndex);
        
        // Try to determine if it's a deadline, assignment, etc.
        const isDeadline = /deadline|due|submit|assignment|exam|quiz/i.test(context);
        if (!isDeadline) return;
        
        // Create a date object
        let deadlineDate: Date;
        try {
          deadlineDate = new Date(match);
          // Check if it's a valid date
          if (isNaN(deadlineDate.getTime())) return;
        } catch (e) {
          return;
        }
        
        // Determine priority based on context
        let priority: 'high' | 'medium' | 'low' = 'medium';
        if (/exam|final|midterm|important/i.test(context)) {
          priority = 'high';
        } else if (/quiz|minor|small/i.test(context)) {
          priority = 'low';
        }
        
        // Extract a title
        let title = 'Deadline';
        if (context.includes('assignment')) title = 'Assignment';
        if (context.includes('exam')) title = 'Exam';
        if (context.includes('quiz')) title = 'Quiz';
        if (context.includes('project')) title = 'Project';
        
        // Add to deadlines
        extractedDeadlines.push({
          id: `${course.id}-${extractedDeadlines.length}`,
          title,
          date: deadlineDate,
          course: course.name,
          courseId: course.id,
          description: context,
          color: course.color || undefined,
          priority,
        });
      });
    });
    
    // Add some fallback data if no deadlines were found
    if (extractedDeadlines.length === 0 && courses.length > 0) {
      // Add course start and end dates as important dates
      courses.forEach(course => {
        if (course.startDate) {
          extractedDeadlines.push({
            id: `${course.id}-start`,
            title: 'Course Start',
            date: new Date(course.startDate),
            course: course.name,
            courseId: course.id,
            color: course.color || undefined,
            priority: 'medium',
          });
        }
        
        if (course.endDate) {
          extractedDeadlines.push({
            id: `${course.id}-end`,
            title: 'Course End',
            date: new Date(course.endDate),
            course: course.name,
            courseId: course.id,
            color: course.color || undefined,
            priority: 'high',
          });
        }
      });
    }
    
    // Sort by date
    extractedDeadlines.sort((a, b) => a.date.getTime() - b.date.getTime());
    setDeadlines(extractedDeadlines);
    
    // Set days with deadlines for calendar indicators
    setDaysWithDeadlines(extractedDeadlines.map(d => d.date));
  }, [courses]);
  
  // Get upcoming deadlines (in next 14 days)
  const upcomingDeadlines = deadlines
    .filter(d => {
      const now = new Date();
      const deadline = new Date(d.date);
      const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 14;
    })
    .sort((a, b) => {
      // Sort by priority, then by date
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium'];
      }
      return a.date.getTime() - b.date.getTime();
    });
  
  // Get selected day deadlines
  const selectedDayDeadlines = date 
    ? deadlines.filter(d => 
        d.date.getDate() === date.getDate() && 
        d.date.getMonth() === date.getMonth() && 
        d.date.getFullYear() === date.getFullYear()
      )
    : [];
  
  // Calendar day renderer with indicators
  const getDayClassNames = (day: Date) => {
    const hasDeadline = daysWithDeadlines.some(d => 
      d.getDate() === day.getDate() && 
      d.getMonth() === day.getMonth() && 
      d.getFullYear() === day.getFullYear()
    );
    
    if (hasDeadline) {
      return "relative before:absolute before:h-1 before:w-1 before:bg-red-500 before:rounded-full before:top-0 before:left-1/2 before:-translate-x-1/2";
    }
    
    return "";
  };
  
  // Chat state
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi there! I'm your EduPlanner assistant. I can help you organize your study schedule, recommend learning resources, or answer questions about your courses. How can I assist you today?"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const newMessages = [
      ...messages,
      { role: "user", content: inputMessage }
    ];
    setMessages(newMessages);
    setInputMessage("");
    
    // Add deadlines context if message mentions deadlines
    if (inputMessage.toLowerCase().includes('deadline') || inputMessage.toLowerCase().includes('assignment')) {
      const deadlineContext = upcomingDeadlines.length > 0 
        ? `I see you have ${upcomingDeadlines.length} upcoming deadlines. The most urgent one is ${upcomingDeadlines[0].title} for ${upcomingDeadlines[0].course} on ${upcomingDeadlines[0].date.toLocaleDateString()}.`
        : "I don't see any upcoming deadlines in your schedule.";
      
      setTimeout(() => {
        setMessages([
          ...newMessages,
          { 
            role: "assistant", 
            content: `${deadlineContext} How can I help you with your schedule?`
          }
        ]);
      }, 1000);
    } else {
      // Regular response
      setTimeout(() => {
        setMessages([
          ...newMessages,
          { 
            role: "assistant", 
            content: `I'm the EduPlanner assistant. I can see your calendar has ${deadlines.length} total deadlines across ${courses?.length || 0} courses. What would you like to know about your schedule?`
          }
        ]);
      }, 1000);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Academic Calendar</span>
                <Badge variant="outline" className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" /> {deadlines.length} deadlines
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-5">
                <div className="md:col-span-3">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                    classNames={{
                      day_today: "bg-primary text-primary-foreground",
                      day_selected: "bg-primary text-primary-foreground font-bold",
                    }}
                    modifiers={{
                      highlight: daysWithDeadlines,
                    }}
                    modifiersClassNames={{
                      highlight: getDayClassNames(new Date()),
                    }}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Tabs defaultValue="upcoming" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                      <TabsTrigger value="selected">Selected Day</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upcoming" className="p-0">
                      <Card>
                        <CardHeader className="p-3">
                          <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <ScrollArea className="h-[220px]">
                            <div className="p-3 space-y-3">
                              {upcomingDeadlines.length === 0 ? (
                                <div className="text-sm text-muted-foreground text-center p-4">
                                  No upcoming deadlines
                                </div>
                              ) : (
                                upcomingDeadlines.map((deadline) => (
                                  <div 
                                    key={deadline.id}
                                    className="p-2 rounded-md border text-sm"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div 
                                        className="flex items-center gap-2"
                                        style={{ color: deadline.color || "inherit" }}
                                      >
                                        {deadline.priority === 'high' ? (
                                          <AlertCircle className="w-4 h-4 text-red-500" />
                                        ) : deadline.priority === 'low' ? (
                                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        ) : (
                                          <Clock className="w-4 h-4 text-yellow-500" />
                                        )}
                                        <span className="font-medium">{deadline.title}</span>
                                      </div>
                                      <Badge 
                                        variant="outline" 
                                        style={{ 
                                          backgroundColor: deadline.color ? `${deadline.color}20` : undefined,
                                          borderColor: deadline.color || undefined
                                        }}
                                      >
                                        {deadline.course}
                                      </Badge>
                                    </div>
                                    <div className="mt-1 flex justify-between">
                                      <span className="text-xs text-muted-foreground">
                                        {deadline.date.toLocaleDateString()}
                                      </span>
                                      <span className="text-xs">
                                        {Math.ceil((deadline.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                                      </span>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="selected" className="p-0">
                      <Card>
                        <CardHeader className="p-3">
                          <CardTitle className="text-sm font-medium">
                            {date ? date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Select a date'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <ScrollArea className="h-[220px]">
                            <div className="p-3 space-y-3">
                              {selectedDayDeadlines.length === 0 ? (
                                <div className="text-sm text-muted-foreground text-center p-4">
                                  No deadlines for this date
                                </div>
                              ) : (
                                selectedDayDeadlines.map((deadline) => (
                                  <div 
                                    key={deadline.id}
                                    className="p-2 rounded-md border"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span 
                                        className="font-medium" 
                                        style={{ color: deadline.color || "inherit" }}
                                      >
                                        {deadline.title}
                                      </span>
                                      <Badge 
                                        variant="outline" 
                                        style={{ 
                                          backgroundColor: deadline.color ? `${deadline.color}20` : undefined,
                                          borderColor: deadline.color || undefined
                                        }}
                                      >
                                        {deadline.course}
                                      </Badge>
                                    </div>
                                    {deadline.description && (
                                      <p className="mt-2 text-xs text-muted-foreground">
                                        {deadline.description.substring(0, 100)}
                                        {deadline.description.length > 100 ? "..." : ""}
                                      </p>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-6">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Current user</h2>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    ID
                  </dt>
                  <dd className="text-base">{user.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Name
                  </dt>
                  <dd className="text-base">{`${user.firstName} ${user.lastName}`}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Email
                  </dt>
                  <dd className="text-base">
                    <a
                      href={`mailto:${user.email}`}
                      className="text-primary hover:underline"
                    >
                      {user.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Created
                  </dt>
                  <dd className="text-base">
                    {user.createdAt.toLocaleString("en-US", { timeZone: "UTC" })} (in UTC)
                  </dd>
                </div>
              </dl>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This data is fetched from your{" "}
                  <a
                    href="/edit/development/models/user"
                    className="text-primary hover:underline"
                  >
                    user
                  </a>{" "}
                  via your autogenerated API.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Chatbot */}
        <Card className="flex flex-col h-full">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">EduPlanner Assistant</h2>
              <div className="flex items-center space-x-2">
                <div className="bg-green-500 rounded-full h-3 w-3"></div>
                <span className="text-sm text-muted-foreground">Powered by Google Gemini</span>
              </div>
            </div>
            <p className="text-muted-foreground mt-2">
              Ask me about study plans, learning resources, or any course questions.
            </p>
          </div>
          
          <div className="flex-grow p-4 overflow-auto h-[400px] flex flex-col space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t mt-auto">
            <div className="flex space-x-2">
              <Input 
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="Type your message here..."
                className="flex-grow"
              />
              <Button onClick={handleSendMessage} type="submit">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
