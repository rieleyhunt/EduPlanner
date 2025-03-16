import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";

function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="white"
      className="w-16 h-16 mb-4"
    >
      <path
        fillRule="evenodd"
        d="M12 2a10 10 0 1 1-10 10 10 10 0 0 1 10-10zm0 2a8 8 0 1 0 8 8 8 8 0 0 0-8-8zm-.75 3.75a.75.75 0 0 1 1.5 0v5l3.25 1.95a.75.75 0 0 1-.75 1.3L11.25 13a.75.75 0 0 1-.75-.75z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function () {
  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-[#7B00FF] to-[#3800FF]">
      
      {/* White Clock Icon */}
      <ClockIcon />

      {/* Title Header - Large */}
      <h1 className="text-white text-7xl font-extrabold">EDUPlanner</h1>

      <Card className="p-8 max-w-md w-full shadow-lg bg-white rounded-lg animate-fade-in mt-6">
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
