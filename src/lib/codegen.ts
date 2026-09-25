import { applyParams, type ExecRequest } from "@/lib/http";

/**
 * Turn a composed request into a runnable snippet.
 *
 * Generated from the same ExecRequest the app actually sends, after variables
 * and auth have been resolved - so the snippet reproduces the request exactly,
 * rather than being a best-effort reconstruction of the form fields.
 */

export type CodeTarget = "curl" | "fetch" | "axios" | "python" | "go";

export const CODE_TARGETS: { value: CodeTarget; label: string; language: string }[] = [
  { value: "curl", label: "cURL", language: "shell" },
  { value: "fetch", label: "JavaScript (fetch)", language: "javascript" },
  { value: "axios", label: "JavaScript (axios)", language: "javascript" },
  { value: "python", label: "Python (requests)", language: "python" },
  { value: "go", label: "Go (net/http)", language: "go" },
];

/** Single-quote for shell, escaping embedded quotes the POSIX way. */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function jsString(value: string): string {
  return JSON.stringify(value);
}

function prettyJsonOrRaw(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

function toCurl(request: ExecRequest, url: string): string {
  const lines = [`curl -X ${request.method} ${shellQuote(url)}`];
  for (const [key, value] of Object.entries(request.headers)) {
    lines.push(`  -H ${shellQuote(`${key}: ${value}`)}`);
  }
  if (request.body !== undefined) {
    lines.push(`  -d ${shellQuote(request.body)}`);
  }
  return lines.join(" \\\n");
}

function toFetch(request: ExecRequest, url: string): string {
  const headerEntries = Object.entries(request.headers);
  const options: string[] = [`  method: ${jsString(request.method)},`];

  if (headerEntries.length) {
    options.push("  headers: {");
    for (const [key, value] of headerEntries) {
      options.push(`    ${jsString(key)}: ${jsString(value)},`);
    }
    options.push("  },");
  }

  if (request.body !== undefined) {
    options.push(`  body: ${jsString(request.body)},`);
  }

  return [
    `const response = await fetch(${jsString(url)}, {`,
    ...options,
    "});",
    "",
    "const data = await response.json();",
    "console.log(data);",
  ].join("\n");
}

function toAxios(request: ExecRequest, url: string): string {
  const headerEntries = Object.entries(request.headers);
  const config: string[] = [
    `  method: ${jsString(request.method.toLowerCase())},`,
    `  url: ${jsString(url)},`,
  ];

  if (headerEntries.length) {
    config.push("  headers: {");
    for (const [key, value] of headerEntries) {
      config.push(`    ${jsString(key)}: ${jsString(value)},`);
    }
    config.push("  },");
  }

  if (request.body !== undefined) {
    // axios serializes an object itself; a JSON body is clearer parsed.
    try {
      const parsed = JSON.parse(request.body);
      config.push(`  data: ${JSON.stringify(parsed, null, 2).replace(/\n/g, "\n  ")},`);
    } catch {
      config.push(`  data: ${jsString(request.body)},`);
    }
  }

  return [
    `import axios from "axios";`,
    "",
    "const response = await axios({",
    ...config,
    "});",
    "",
    "console.log(response.data);",
  ].join("\n");
}

function toPython(request: ExecRequest, url: string): string {
  const lines = ["import requests", "", `url = ${JSON.stringify(url)}`];

  const headerEntries = Object.entries(request.headers);
  if (headerEntries.length) {
    lines.push("headers = {");
    for (const [key, value] of headerEntries) {
      lines.push(`    ${JSON.stringify(key)}: ${JSON.stringify(value)},`);
    }
    lines.push("}");
  }

  const args = ["url"];
  if (headerEntries.length) args.push("headers=headers");

  if (request.body !== undefined) {
    try {
      const parsed = JSON.parse(request.body);
      lines.push(`payload = ${JSON.stringify(parsed, null, 4)}`);
      args.push("json=payload");
    } catch {
      lines.push(`payload = ${JSON.stringify(request.body)}`);
      args.push("data=payload");
    }
  }

  lines.push(
    "",
    `response = requests.${request.method.toLowerCase()}(${args.join(", ")})`,
    "print(response.status_code)",
    "print(response.text)"
  );

  return lines.join("\n");
}

function toGo(request: ExecRequest, url: string): string {
  const hasBody = request.body !== undefined;
  const lines = [
    "package main",
    "",
    "import (",
    '\t"fmt"',
    '\t"io"',
    '\t"net/http"',
  ];
  if (hasBody) lines.push('\t"strings"');
  lines.push(")", "", "func main() {");

  if (hasBody) {
    lines.push(`\tbody := strings.NewReader(${JSON.stringify(request.body)})`);
    lines.push(
      `\treq, err := http.NewRequest(${JSON.stringify(request.method)}, ${JSON.stringify(url)}, body)`
    );
  } else {
    lines.push(
      `\treq, err := http.NewRequest(${JSON.stringify(request.method)}, ${JSON.stringify(url)}, nil)`
    );
  }

  lines.push("\tif err != nil {", "\t\tpanic(err)", "\t}");

  for (const [key, value] of Object.entries(request.headers)) {
    lines.push(`\treq.Header.Set(${JSON.stringify(key)}, ${JSON.stringify(value)})`);
  }

  lines.push(
    "",
    "\tres, err := http.DefaultClient.Do(req)",
    "\tif err != nil {",
    "\t\tpanic(err)",
    "\t}",
    "\tdefer res.Body.Close()",
    "",
    "\tout, _ := io.ReadAll(res.Body)",
    "\tfmt.Println(res.Status)",
    "\tfmt.Println(string(out))",
    "}"
  );

  return lines.join("\n");
}

export function generateCode(request: ExecRequest, target: CodeTarget): string {
  // Params live separately until send time; fold them in so the snippet is
  // self-contained.
  const url = applyParams(request.url, request.params);

  switch (target) {
    case "fetch":
      return toFetch(request, url);
    case "axios":
      return toAxios(request, url);
    case "python":
      return toPython(request, url);
    case "go":
      return toGo(request, url);
    case "curl":
    default:
      return toCurl(request, url);
  }
}

export { prettyJsonOrRaw };
