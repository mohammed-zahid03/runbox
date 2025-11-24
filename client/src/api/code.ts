// Piston API (Execution)
export const executeCode = async (language: string, sourceCode: string) => {
  const response = await fetch("https://emkc.org/api/v2/piston/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: language,
      version: "*",
      files: [{ content: sourceCode }],
    }),
  });
  return await response.json();
};

// Backend API (Saving)
export const saveCode = async (userId: string, code: string) => {
  const response = await fetch("http://localhost:5000/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      code,
      language: "javascript"
    }),
  });
  return await response.json();
};

// Fetch User Snippets
export const getAllSnippets = async (userId: string) => {
  const response = await fetch(`http://localhost:5000/api/snippets/${userId}`);
  return await response.json();
};

// Fetch Single Snippet
export const getSnippetById = async (id: string) => {
  const response = await fetch(`http://localhost:5000/api/snippet/${id}`);
  return await response.json();
};

// Delete Snippet
export const deleteSnippet = async (id: string) => {
  try {
    const response = await fetch(`http://localhost:5000/api/snippets/${id}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    console.error("Error deleting snippet:", error);
  }
};