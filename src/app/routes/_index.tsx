import { redirect } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";

export const loader: LoaderFunction = async () => {
  return redirect("/cases/case-documents");
};

// This component will never be rendered since we're redirecting
export default function Index() {
  return null;
}
