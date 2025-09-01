import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast"; // Assuming this is available

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const errorData = text ? JSON.parse(text) : { message: res.statusText };
    throw new Error(`${res.status}: ${errorData.message || text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  options: { on401?: "returnNull" | "throw" } = {}
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const token = localStorage.getItem("smartq_token");
  console.log("apiRequest - Token from localStorage:", token);
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log("apiRequest - Authorization header set:", headers["Authorization"]);
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (options.on401 === "returnNull" && res.status === 401) {
    localStorage.removeItem("smartq_token"); // Clear expired token
    return res; // Caller can handle null response
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401?: UnauthorizedBehavior;
  endpoint?: string; // Optional endpoint for typing
}) => QueryFunction<T> =
  ({ on401 = "throw", endpoint }) =>
  async ({ queryKey }) => {
    const [baseUrl, ...params] = queryKey;
    let url = baseUrl as string;

    // Handle parameters (e.g., /api/salons/:id or /api/salons?location=...)
    if (params.length > 0) {
      url += "/" + params.join("/");
      const query = params.find((p) => typeof p === "object");
      if (query) {
        url += "?" + new URLSearchParams(query as Record<string, string>).toString();
      }
    }

    const headers: Record<string, string> = {};
    const token = localStorage.getItem("smartq_token");
    console.log("getQueryFn - Token from localStorage:", token);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      console.log("getQueryFn - Authorization header set:", headers["Authorization"]);
    }

    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (on401 === "returnNull" && res.status === 401) {
      localStorage.removeItem("smartq_token");
      return null as T; // Type assertion for null case
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 30000, // Refetch every 30 seconds for real-time data
      refetchOnWindowFocus: true, // Refetch on focus for updates
      staleTime: 60000, // Data is fresh for 1 minute
      retry: 1, // Retry once on failure
      onError: (error: Error) => {
        const { toast } = useToast(); // This might need context integration
        if (error.message.includes("401")) {
          toast({
            title: "Session expired",
            description: "Please log in again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      },
    },
    mutations: {
      retry: 1, // Retry once on failure
      onError: (error: Error) => {
        const { toast } = useToast();
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    },
  },
});
