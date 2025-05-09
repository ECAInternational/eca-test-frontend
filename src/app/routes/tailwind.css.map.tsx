import type { LoaderFunction } from "@remix-run/node";

// Return a 204 No Content for source map requests
export const loader: LoaderFunction = async () => {
  return new Response(null, { status: 204 });
};
