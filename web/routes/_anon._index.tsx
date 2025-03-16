import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";

export default function () {
  return (
    <div className="relative min-h-screen flex justify-center items-center bg-gradient-to-b from-[#7B00FF] to-[#3800FF]">
      <h1 className="absolute top-8 text-white text-8x1 font-extrabold">EDUPlanner</h1>
      <Card className="p-8 max-w-md w-full shadow-lg bg-white rounded-lg animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-gray-800">
            🎓 Welcome to EDUPlanner!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-gray-600 text-base">
            EDUPlanner is your all-around interactive student planner. Sign in or create an account to get started.
          </p>
          
          <Button
            className="w-full bg-[#7B00FF] hover:bg-[#AA5CFF] text-white rounded-lg transition-all duration-300 ease-in-out"
            asChild
          >
            <Link to="/sign-up">Sign up</Link>
          </Button>
          
          <Button
            className="w-full bg-[#3800FF] text-white hover:bg-[#687BFC] rounded-lg transition-all duration-300 ease-in-out"
            asChild
          >
            <Link to="/sign-in">Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
