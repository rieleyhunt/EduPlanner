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
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-6">
        <Outlet context={context} />
      </div>
    </div>
  );
}
