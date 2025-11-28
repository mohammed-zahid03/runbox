export const LANGUAGE_VERSIONS = {
  javascript: "18.15.0",
  python: "3.10.0",
  java: "15.0.2",
  csharp: "6.12.0",
  php: "8.2.3",
};

export const CODE_SNIPPETS = {
  javascript: `\nfunction greet(name) {\n\tconsole.log("Hello, " + name + "!");\n}\n\ngreet("Runbox");\n`,
  python: `\ndef greet(name):\n\tprint("Hello, " + name + "!")\n\ngreet("Runbox")\n`,
  java: `\npublic class Main {\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println("Hello, Runbox!");\n\t}\n}\n`,
  csharp: `\nusing System;\n\nnamespace HelloWorld\n{\n\tclass Program\n\t{\n\t\tstatic void Main(string[] args)\n\t\t{\n\t\t\tConsole.WriteLine("Hello, Runbox!");\n\t\t}\n\t}\n}\n`,
  php: "<?php\n\n$name = 'Runbox';\necho $name;\n",
};