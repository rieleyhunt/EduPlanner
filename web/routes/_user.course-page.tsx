import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { Home, LogOut, Menu, Plus, User } from "lucide-react";
import { useState } from "react";
import { Link, Outlet, useLocation, useOutletContext } from "react-router";
import type { RootOutletContext } from "../root";
import { useSignOut } from "@gadgetinc/react";

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

  return (
    <div className="flex flex-col flex-grow bg-background border-r h-full">
      <div className="h-16 flex items-center px-6 border-b">
        <Link to="/" className="flex items-center">
          <img
            src="/api/assets/autologo?background=dark"
            alt="App name"
            className="h-8 w-auto"
          />
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
              title="Add course fuck"
            >
              <Plus className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
};

const CoursePage = () => {
  const rootOutletContext = useOutletContext<RootOutletContext>();
  const user = rootOutletContext.user;

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0">
        <SideBar />
      </div>
      <div className="flex-1 flex flex-col md:pl-64">
        <header className="h-16 flex items-center justify-between px-6 border-b bg-background">
          <div className="ml-auto">
            <UserMenu user={user} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <h2 className="text-xl font-bold mb-4">New Course</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Syllabus</h3>
                      <button className="p-1 rounded-full hover:bg-accent">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">...</p>
                  </div>
                  <div className="border p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Notes</h3>
                      <button className="p-1 rounded-full hover:bg-accent">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">...</p>
                  </div>
                  <div className="border p-4 rounded-lg col-span-2">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Assignments</h3>
                      <button className="p-1 rounded-full hover:bg-accent">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">...</p>
                  </div>
                </div>
              </div>
              <div className="border p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Course Assistant</h2>
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto">
                    <p className="text-sm text-muted-foreground">...</p>
                  </div>
                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="Type your message here"
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
            <Toaster richColors />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CoursePage;