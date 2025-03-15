import { Outlet, redirect, useOutletContext, Link } from "react-router";
import type { RootOutletContext } from "../root";
import type { Route } from "./+types/_anon";

export const loader = async ({ context }: Route.LoaderArgs) => {
  const { session, gadgetConfig } = context;

  const signedIn = !!session?.get("user");

  if (signedIn) {
    return redirect(
      gadgetConfig.authentication!.redirectOnSuccessfulSignInPath!
    );
  }

  return {};
};

export default function () {
  const context = useOutletContext<RootOutletContext>();

  return (
    <div className="flex h-screen w-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 border-r border-gray-200 p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold">My App</h1>
        </div>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                className="block px-4 py-2 rounded hover:bg-gray-200 transition-colors"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/sign-in"
                className="block px-4 py-2 rounded hover:bg-gray-200 transition-colors"
              >
                Sign In
              </Link>
            </li>
            <li>
              <Link
                to="/sign-up"
                className="block px-4 py-2 rounded hover:bg-gray-200 transition-colors"
              >
                Sign Up
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 p-8 overflow-auto">
        <Outlet context={context} />
      </div>
    </div>
  );
}
