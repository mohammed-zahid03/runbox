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