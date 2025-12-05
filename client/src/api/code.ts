// client/src/api/code.ts
import { getToken } from "@clerk/clerk-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PISTON_EXECUTE_URL = "https://emkc.org/api/v2/piston/execute";

// maximum allowed source size sent from client (server also enforces its own limits)
const MAX_SOURCE_LENGTH = 20000; // 20k chars

// helpful util: build auth headers using Clerk token
async function authHeaders(): Promise<HeadersInit> {
  const token = await getToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Execute code using Piston public API (client -> external).
 * NOTE: For production, proxy this request through your backend (/api/execute) to control usage and hide credentials.
 */
export const executeCode = async (language: string, sourceCode: string): Promise<any> => {
  if (!language || !sourceCode) throw new Error("Missing language or sourceCode");
  if (sourceCode.length > MAX_SOURCE_LENGTH) throw new Error("Source code too large");

  // 10 second timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(PISTON_EXECUTE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        version: "*",
        files: [{ content: sourceCode }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Execution service error: ${res.status} ${text}`);
    }
    return await res.json();
  } catch (err: any) {
    if (err.name === "AbortError") throw new Error("Execution timed out");
    throw err;
  }
};

/*
  // If you add a server-side execute proxy endpoint (/api/execute),
  // use this instead of calling Piston directly:

export const executeCode = async (language: string, sourceCode: string) => {
  if (!language || !sourceCode) throw new Error("Missing language or sourceCode");
  if (sourceCode.length > MAX_SOURCE_LENGTH) throw new Error("Source code too large");

  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/execute`, {
    method: "POST",
    headers,
    body: JSON.stringify({ language, sourceCode }),
  });
  if (!res.ok) throw new Error("Execution failed");
  return await res.json();
};
*/

/**
 * Save snippet to backend (authenticated).
 * Frontend must NOT send userId — server determines user from token.
 */
export const saveCode = async (code: string, language = "javascript"): Promise<any> => {
  if (!code || !language) throw new Error("Missing code or language");
  if (code.length > MAX_SOURCE_LENGTH) throw new Error("Code too large");

  const headers = await authHeaders();

  const res = await fetch(`${API_BASE}/api/save`, {
    method: "POST",
    headers,
    body: JSON.stringify({ code, language }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Save failed: ${res.status} ${errText}`);
  }

  return await res.json();
};

/**
 * Fetch the current user's snippets (paginated support).
 * Returns array of snippets (backend returns { data: snippets, page, limit })
 */
export const getAllSnippets = async (page = 1, limit = 20): Promise<any[]> => {
  const headers = await authHeaders();

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  const res = await fetch(`${API_BASE}/api/snippets?${params.toString()}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Failed to load snippets: ${res.status} ${errText}`);
  }

  const json = await res.json();
  // backend returns { data: snippets, page, limit }
  return json.data ?? [];
};

/**
 * Fetch single snippet by id (authenticated + server will enforce ownership)
 */
export const getSnippetById = async (id: string): Promise<any> => {
  if (!id) throw new Error("Missing snippet id");
  const headers = await authHeaders();

  const
