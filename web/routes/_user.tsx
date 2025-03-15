import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { useFindMany, useSignOut } from "@gadgetinc/react";
import { Home, LogOut, Menu, Plus, User } from "lucide-react";
import { api } from "../api";
import { useState } from "react";
import {
  Link,
  Outlet,
  redirect,
  useLocation,
  useOutletContext,
} from "react-router";
import type { RootOutletContext } from "../root";
import type { Route } from "./+types/_user";

export const loader = async ({ context }: Route.LoaderArgs) => {
  const { session, gadgetConfig } = context;

  const userId = session?.get("user");
  const user = userId ? await context.api.user.findOne(userId) : undefined;

  if (!user) {
    return redirect(gadgetConfig.authentication!.signInPath);
  }

  return {
    user,
  };
};

export type AuthOutletContext = RootOutletContext & {
  user?: any;
};

const UserMenu = ({ user }: { user: any }) => {
  const [userMenuActive, setUserMenuActive] = useState(false);
  const signOut = useSignOut();

  const getInitials = () => {
    return (
      (user.firstName?.slice(0, 1) ?? "") + (user.lastName?.slice(0, 1) ?? "")
    ).toUpperCase();
  };

  return (
    <DropdownMenu open={userMenuActive} onOpenChange={setUserMenuActive}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full p-1 hover:bg-accent">
          <Avatar>
            {user.profilePicture?.url ? (
              <AvatarImage
                src={user.profilePicture.url}
                alt={user.firstName ?? user.email}
              />
            ) : (
              <AvatarFallback>{getInitials()}</AvatarFallback>
            )}
          </Avatar>
          <span className="text-sm font-medium">
            {user.firstName ?? user.email}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={signOut}
          className="flex items-center text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const SideBar = () => {
  const location = useLocation();
  const [{ data: courses, fetching, error }] = useFindMany(api.course);

  return (
    <div className="flex flex-col flex-grow bg-background border-r h-full">
      <div className="h-16 flex items-center px-6 border-b">
        <Link to="/" className="flex items-center">
        <svg width="100" height="100" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
               <rect x="200" y="100" width="80" height = "50" fill="#2EE756" />
               <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="24" fill="#ffffff" fontFamily="Arial" fontWeight="bold">
                EDU
               </text>
               <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" fontSize="24" fill="#ffffff" fontFamily="Arial" fontWeight="bold">
                PLANNER
               </text>
              </svg>
        </Link>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-4">
        <Link
          to="/signed-in"
          className={`flex items-center px-4 py-2 text-sm rounded-md transition-colors
      ${
        location.pathname === "/signed-in"
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent hover:text-accent-foreground"
      }`}
        >
          <Home className="mr-3 h-4 w-4" />
          Home
        </Link>

        <div>
          <div className="flex items-center justify-between px-4 mb-2">
            <h3 className="font-medium text-sm">My Courses</h3>
            <Link 
              to="/courses/new" 
              className="p-1 rounded-full hover:bg-accent"
              title="Add course"
            >
              <Plus className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-1">
            {fetching && (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                Loading courses...
              </div>
            )}
            {error && (
              <div className="px-4 py-2 text-sm text-red-500">
                Error loading courses
              </div>
            )}
            {courses?.map((course) => (
              <Link
                key={course.id}
                to={`/course/${course.id}`}
                className={`flex items-center px-4 py-2 text-sm rounded-md transition-colors
                ${
                  location.pathname === `/course/${course.id}`
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <div 
                  className="w-3 h-3 mr-3 rounded-full"
                  style={{ backgroundColor: course.color || "#cbd5e1" }}
                />
                {course.name}
              </Link>
            ))}
            {courses?.length === 0 && !fetching && !error && (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                No courses yet
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

const SideBarMenuButtonDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="md:hidden" // Only show on slim screen
    >
      <button
        className="flex items-center rounded-full hover:bg-accent p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="h-6 w-6" />
      </button>
      <div
        className={`fixed inset-y-0 left-0 w-64 transform transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } bg-background shadow-lg z-20`}
      >
        <SideBar />
      </div>

      {isOpen && (
        // Background opacity cover
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/30 z-10"
        />
      )}
    </div>
  );
};

export default function ({ loaderData }: Route.ComponentProps) {
  const user = "user" in loaderData ? loaderData.user : undefined;
  const rootOutletContext = useOutletContext<RootOutletContext>();

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0">
        <SideBar />
      </div>
      <div className="flex-1 flex flex-col md:pl-64">
        <header className="h-16 flex items-center justify-between px-6 border-b bg-background">
          <SideBarMenuButtonDrawer />
          <div className="ml-auto">
            <UserMenu user={user} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            <Outlet
              context={{ ...rootOutletContext, user } as AuthOutletContext}
            />
            <Toaster richColors />
          </div>
        </main>
      </div>
    </div>
  );
}
