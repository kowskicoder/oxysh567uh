import { QueryClient } from "@tanstack/react-query";

function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    throw new Error(`${res.status}: ${res.statusText}`);
  }
}

// Get Privy auth token from localStorage
function getAuthToken(): string | null {
  try {
    // Privy stores tokens in a different format - check multiple possible locations
    // First, try the standard Privy token location
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('privy:')) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const parsed = JSON.parse(value);
            // Look for access_token in various possible structures
            if (parsed.token) return parsed.token;
            if (parsed.access_token) return parsed.access_token;
            if (parsed.accessToken) return parsed.accessToken;
            if (typeof parsed === 'string' && parsed.startsWith('eyJ')) return parsed;
          } catch {
            // If it's already a string token, return it
            if (typeof value === 'string' && value.startsWith('eyJ')) {
              return value;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return null;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<any> {
  const authToken = getAuthToken();
  
  // Debug logging
  if (!authToken) {
    console.warn('No auth token found for request to:', url);
  }

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {}),
    },
    credentials: "include",
  };

  if (data !== undefined) {
    options.body = JSON.stringify(data);
  }

  const res = await fetch(url, options);

  try {
    throwIfResNotOk(res);
  } catch (error) {
    let errorMessage = `Error: ${res.status}`;
    try {
      const errorData = await res.json();
      errorMessage += `: ${JSON.stringify(errorData)}`;
    } catch {
      errorMessage += `: ${res.statusText}`;
    }
    console.error("API Request Error:", errorMessage);
    throw new Error(errorMessage);
  }

  // Check if response has content
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }

  // If no JSON content, return empty object
  return {};
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        const params = queryKey[1] as Record<string, string> | undefined;

        let fullUrl = url;
        if (params) {
          const searchParams = new URLSearchParams(params);
          fullUrl += `?${searchParams.toString()}`;
        }

        const authToken = getAuthToken();
        
        // Debug logging for queries
        if (!authToken) {
          console.warn('No auth token found for query to:', fullUrl);
        }

        const res = await fetch(fullUrl, {
          credentials: "include",
          headers: {
            ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {}),
          },
        });

        try {
          throwIfResNotOk(res);
        } catch (error) {
          let errorMessage = `Error: ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage += `: ${JSON.stringify(errorData)}`;
          } catch {
            errorMessage += `: ${res.statusText}`;
          }
          console.error("Query Function Error:", errorMessage);
          throw new Error(errorMessage);
        }

        // Check if response has content
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return res.json();
        }

        return {};
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});