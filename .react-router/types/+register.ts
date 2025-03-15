import "react-router";

declare module "react-router" {
  interface Register {
    params: Params;
  }
}

type Params = {
  "/": {};
  "/forgot-password": {};
  "/reset-password": {};
  "/verify-email": {};
  "/sign-in": {};
  "/sign-up": {};
  "/course-page": {};
  "/courses/new": {};
  "/course/:id": {
    "id": string;
  };
  "/signed-in": {};
  "/profile": {};
};