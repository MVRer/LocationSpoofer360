type Handler = (req: Request, params: Record<string, string>) => Response | Promise<Response>;

interface Route {
  method: string;
  pattern: URLPattern;
  handler: Handler;
}

const routes: Route[] = [];

export function addRoute(method: string, path: string, handler: Handler) {
  routes.push({
    method: method.toUpperCase(),
    pattern: new URLPattern({ pathname: path }),
    handler,
  });
}

export function get(path: string, handler: Handler) {
  addRoute("GET", path, handler);
}

export function post(path: string, handler: Handler) {
  addRoute("POST", path, handler);
}

export function put(path: string, handler: Handler) {
  addRoute("PUT", path, handler);
}

export function del(path: string, handler: Handler) {
  addRoute("DELETE", path, handler);
}

export function matchRoute(req: Request): { handler: Handler; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== req.method) continue;
    const match = route.pattern.exec(req.url);
    if (match) {
      const params: Record<string, string> = {};
      for (const [key, value] of Object.entries(match.pathname.groups)) {
        if (value !== undefined) params[key] = value;
      }
      return { handler: route.handler, params };
    }
  }
  return null;
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}
