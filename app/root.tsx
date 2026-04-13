import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import type { Route } from "./+types/root";
import "./styles/global.css";

export const links: Route.LinksFunction = () => [
  {
    rel: "stylesheet",
    href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    integrity: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=",
    crossOrigin: "",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>LocationSpoofer360</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    message = error.data || error.statusText;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-200 gap-4 p-8">
      <h1 className="text-xl font-semibold text-red-400">Something went wrong</h1>
      <p className="text-sm text-slate-400 max-w-md text-center">{message}</p>
      <button
        type="button"
        className="px-4 py-2 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
        onClick={() => window.location.reload()}
      >
        Reload
      </button>
    </div>
  );
}
