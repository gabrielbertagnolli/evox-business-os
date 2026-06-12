#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const createIndexConcurrentlyPattern = /\bCREATE\s+(?:UNIQUE\s+)?INDEX\s+CONCURRENTLY\b/gi;

const files = process.argv
  .slice(2)
  .filter(Boolean)
  .filter((file) => file.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.log("No added SQL migration files found, skipping Squawk migration lint.");
  process.exit(0);
}

const lineNumberAt = (content, index) => content.slice(0, index).split("\n").length;

const maskPreservingNewlines = (text) => text.replace(/[^\n]/g, " ");

const maskSqlCommentsAndLiterals = (content) => {
  let masked = "";
  let index = 0;
  while (index < content.length) {
    const rest = content.slice(index);
    if (rest.startsWith("--")) {
      const end = content.indexOf("\n", index + 2);
      const commentEnd = end === -1 ? content.length : end;
      masked += maskPreservingNewlines(content.slice(index, commentEnd));
      index = commentEnd;
      continue;
    }
    if (rest.startsWith("/*")) {
      const end = content.indexOf("*/", index + 2);
      const commentEnd = end === -1 ? content.length : end + 2;
      masked += maskPreservingNewlines(content.slice(index, commentEnd));
      index = commentEnd;
      continue;
    }
    if (content[index] === "'") {
      let literalEnd = index + 1;
      while (literalEnd < content.length) {
        if (content[literalEnd] === "'" && content[literalEnd + 1] === "'") {
          literalEnd += 2;
          continue;
        }
        if (content[literalEnd] === "'") {
          literalEnd += 1;
          break;
        }
        literalEnd += 1;
      }
      masked += maskPreservingNewlines(content.slice(index, literalEnd));
      index = literalEnd;
      continue;
    }
    const dollarQuote = rest.match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/);
    if (dollarQuote) {
      const delimiter = dollarQuote[0];
      const bodyEnd = content.indexOf(delimiter, index + delimiter.length);
      const literalEnd = bodyEnd === -1 ? content.length : bodyEnd + delimiter.length;
      masked += maskPreservingNewlines(content.slice(index, literalEnd));
      index = literalEnd;
      continue;
    }
    masked += content[index];
    index += 1;
  }
  return masked;
};

const errors = [];

for (const file of files) {
  if (!existsSync(file)) {
    console.warn(`Warning: ${file} does not exist, skipping`);
    continue;
  }

  const contents = readFileSync(file, "utf8");
  const scanContent = maskSqlCommentsAndLiterals(contents);
  for (const match of scanContent.matchAll(createIndexConcurrentlyPattern)) {
    errors.push(
      `${file}:${lineNumberAt(contents, match.index ?? 0)} CREATE INDEX CONCURRENTLY is not allowed in managed Supabase migrations; use CREATE INDEX IF NOT EXISTS with bounded lock_timeout and statement_timeout instead.`,
    );
  }
}

if (errors.length > 0) {
  console.error("SQL migration idempotency lint failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

const squawk = spawnSync(
  "bun",
  [
    "run",
    "squawk",
    "--reporter=gcc",
    "--include=prefer-robust-stmts",
    "--no-assume-in-transaction",
    ...files,
  ],
  { stdio: "inherit" },
);

if (squawk.error) {
  console.error(`Failed to run Squawk migration lint: ${squawk.error.message}`);
  process.exit(1);
}
if (typeof squawk.status === "number") {
  process.exit(squawk.status);
}
if (squawk.signal) {
  console.error(`Squawk migration lint terminated by signal ${squawk.signal}`);
}
process.exit(1);
