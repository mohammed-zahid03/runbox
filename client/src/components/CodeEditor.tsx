import { Editor } from "@monaco-editor/react";

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
}

export default function CodeEditor({ code, onChange }: CodeEditorProps) {
  return (
    <div className="w-full h-full bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-700 shadow-2xl">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        value={code} 
        onChange={onChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 16,
          lineNumbers: "on",
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}