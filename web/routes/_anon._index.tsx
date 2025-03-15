import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";

export default function () {
  return (
    <Card className="p-8">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">🫃 Welcome to EDUPlanner!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-base">
          EDUPlanner is your all-around interactive student planner. 
          Sign in/Create an Account to get started. <a
            href="/edit/files/web/routes/_anon._index.jsx"
            target="_blank"
            rel="noreferrer"
            className="font-medium hover:underline"
          > 
             
          </a>
        </p>
        
        <Button
          variant="default"
          size="lg"
          className="w-full"
          asChild
        >
          <Link to="/sign-up">Sign up</Link>
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          asChild
        >
          <Link to="/sign-in">Sign in</Link>
        </Button>
        
      </CardContent>
    </Card>
  );
}
