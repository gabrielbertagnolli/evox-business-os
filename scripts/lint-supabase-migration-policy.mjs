#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, relative, resolve } from "node:path";

const filenamePattern = /^\d{14}_[a-z0-9][a-z0-9_-]*\.sql$/;
const migrationTimestampPattern = /^(\d{14})_/;
const sqlIdentifier = String.raw`"[^"]+"|[A-Za-z_][A-Za-z0-9_]*`;
const createTablePattern = new RegExp(
  String.raw`^\s*CREATE\s+(?:(?<temp>TEMP|TEMPORARY)\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(?<schema>${sqlIdentifier})\s*\.\s*)?(?<table>${sqlIdentifier})\s*\(`,
  "gim",
);
const createIndexConcurrentlyPattern = /^\s*CREATE\s+(?:UNIQUE\s+)?INDEX\s+CONCURRENTLY\b/gim;
const enableRlsPattern = new RegExp(
  String.raw`^\s*ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?(?:(?<schema>${sqlIdentifier})\s*\.\s*)?(?<table>${sqlIdentifier})\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY\b`,
  "gim",
);
const rlsDisableCommentPattern = /--\s*rls-lint:\s*disable/i;

const files = (
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : (process.env.CHANGED_FILES ?? "").split(/\s+/)
)
  .filter(Boolean)
  .filter((file) => file.endsWith(".sql"))
  .sort();

const errors = [];
const baseRef = process.env.BASE_REF || "main";
const remoteBaseRef = baseRef.startsWith("origin/") ? baseRef : `origin/${baseRef}`;

const reportErrorsAndExit = () => {
  console.error("SQL migration lint failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
};

const migrationHistoryChanges = (diffArgs) => {
  try {
    return execFileSync(
      "git",
      ["diff", "--name-status", "--diff-filter=DR", ...diffArgs, "--", "supabase/migrations"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    )
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => {
        const [status, oldPath, newPath] = line.split("\t");
        if (status === "D" && oldPath?.endsWith(".sql")) {
          return [oldPath];
        }
        if (status?.startsWith("R") && oldPath?.endsWith(".sql")) {
          return [newPath ? `${oldPath} -> ${newPath}` : oldPath];
        }
        return [];
      });
  } catch {
    return [];
  }
};

const baseMigrationFilesForHistoryCheck = () => {
  try {
    return new Set(
      execFileSync("git", ["ls-tree", "-r", "--name-only", remoteBaseRef, "supabase/migrations"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      })
        .split(/\s+/)
        .filter(Boolean)
        .filter((file) => file.endsWith(".sql")),
    );
  } catch {
    return null;
  }
};

const originalMigrationPath = (migrationHistoryChange) =>
  migrationHistoryChange.split(" -> ", 1)[0];

const checkDeletedOrRenamedMigrations = () => {
  const stagedChanges = migrationHistoryChanges(["--cached"]);
  const baseMigrationFiles = stagedChanges.length > 0 ? baseMigrationFilesForHistoryCheck() : null;
  const protectedStagedChanges =
    baseMigrationFiles === null
      ? stagedChanges
      : stagedChanges.filter((path) => baseMigrationFiles.has(originalMigrationPath(path)));

  const changedPaths = new Set([
    ...migrationHistoryChanges([`${remoteBaseRef}...HEAD`]),
    ...protectedStagedChanges,
  ]);
  if (changedPaths.size === 0) {
    return;
  }

  const restoredPaths = [...changedPaths].sort().map((path) => `Restore ${path}.`);
  errors.push(
    [
      "Applied Supabase migration files cannot be deleted or renamed.",
      ...restoredPaths,
      "Create a new migration to reverse or replace an applied migration instead.",
    ].join(" "),
  );
};

checkDeletedOrRenamedMigrations();

if (files.length === 0) {
  if (errors.length > 0) {
    reportErrorsAndExit();
  }
  console.log("No changed SQL migration files found, skipping migration lint.");
  process.exit(0);
}

const normalizeIdentifier = (identifier) => {
  if (!identifier) {
    return "";
  }
  const trimmed = identifier.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).toLowerCase();
  }
  return trimmed.toLowerCase();
};

const relativeMigrationPath = (file) => {
  const relativePath = relative(process.cwd(), resolve(file)).replaceAll("\\", "/");
  if (relativePath.startsWith("../") || relativePath === ".." || relativePath.startsWith("/")) {
    return null;
  }
  return relativePath;
};

const getBaseMigrationFiles = () => {
  try {
    return execFileSync(
      "git",
      ["ls-tree", "-r", "--name-only", remoteBaseRef, "supabase/migrations"],
      { encoding: "utf8" },
    )
      .split(/\s+/)
      .filter(Boolean)
      .filter((file) => file.endsWith(".sql"));
  } catch {
    console.warn(
      `Warning: could not inspect base migration history for ${remoteBaseRef}; skipping added-migration timestamp duplicate check.`,
    );
    return [];
  }
};

const baseMigrationFileList = getBaseMigrationFiles();
const baseMigrationFiles = new Set(baseMigrationFileList);
const baseMigrationTimestamps = baseMigrationFileList
  .map((file) => basename(file).match(migrationTimestampPattern)?.[1])
  .filter(Boolean)
  .sort();
const existingMigrationTimestamps = new Set(baseMigrationTimestamps);
const latestExistingMigrationTimestamp = baseMigrationTimestamps.at(-1) ?? null;
const addedFilesFromEnv = new Set(
  (process.env.ADDED_FILES ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .filter((file) => file.endsWith(".sql")),
);
const addedFiles =
  addedFilesFromEnv.size > 0
    ? addedFilesFromEnv
    : new Set(
        files.filter((file) => {
          const relativePath = relativeMigrationPath(file);
          return (
            relativePath !== null &&
            relativePath.startsWith("supabase/migrations/") &&
            !baseMigrationFiles.has(relativePath)
          );
        }),
      );

const isAddedMigrationFile = (file) => {
  if (addedFiles.has(file)) {
    return true;
  }
  const relativePath = relativeMigrationPath(file);
  return relativePath !== null && addedFiles.has(relativePath);
};

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

const extractTableIdentifier = (match) => [
  normalizeIdentifier(match.groups?.schema),
  normalizeIdentifier(match.groups?.table),
];

const isSystemTable = (tableName) => tableName.startsWith("_") || tableName.startsWith("pg_");

const findTableSet = (content, pattern) => {
  const tableSet = new Set();
  for (const match of content.matchAll(pattern)) {
    const [schema, table] = extractTableIdentifier(match);
    tableSet.add(`${schema}.${table}`);
  }
  return tableSet;
};

const getExpectedTableKeys = (schema, table) => {
  if (schema === "") {
    return [`.${table}`, `public.${table}`];
  }
  if (schema === "public") {
    return [`public.${table}`, `.${table}`];
  }
  return [`${schema}.${table}`];
};

const hasDisableComment = (content, match) => {
  const createOffset = match[0].toUpperCase().indexOf("CREATE");
  const createIndex = (match.index ?? 0) + createOffset;
  const lineStart = content.lastIndexOf("\n", createIndex - 1) + 1;
  let lineEnd = content.indexOf("\n", createIndex);
  if (lineEnd === -1) {
    lineEnd = content.length;
  }

  const currentLine = content.slice(lineStart, lineEnd);
  if (rlsDisableCommentPattern.test(currentLine)) {
    return true;
  }

  let searchEnd = lineStart - 1;
  while (searchEnd >= 0) {
    const prevLineStart = content.lastIndexOf("\n", searchEnd - 1) + 1;
    const previousLine = content.slice(prevLineStart, searchEnd);
    const strippedLine = previousLine.trim();
    if (!strippedLine) {
      searchEnd = prevLineStart - 1;
      continue;
    }
    return rlsDisableCommentPattern.test(previousLine);
  }
  return false;
};

const seenTimestamps = new Set();

for (const file of files) {
  const filename = basename(file);
  if (!existsSync(file)) {
    console.warn(`Warning: ${file} does not exist, skipping`);
    continue;
  }
  const stats = statSync(file);
  if (!filenamePattern.test(filename)) {
    errors.push(
      `${file}: expected format YYYYMMDDHHMMSS_description.sql using lowercase letters, numbers, and underscores.`,
    );
  }

  const [timestamp] = filename.split("_", 1);
  if (seenTimestamps.has(timestamp)) {
    errors.push(`${file}: duplicate migration timestamp ${timestamp}.`);
  }
  seenTimestamps.add(timestamp);

  if (isAddedMigrationFile(file) && filenamePattern.test(filename)) {
    if (existingMigrationTimestamps.has(timestamp)) {
      errors.push(
        `${file}: duplicate migration timestamp ${timestamp}; an existing migration already uses that timestamp.`,
      );
    }
    if (latestExistingMigrationTimestamp !== null && timestamp < latestExistingMigrationTimestamp) {
      errors.push(
        `${file}: migration timestamp ${timestamp} is older than existing migration timestamp ${latestExistingMigrationTimestamp}; create new migrations with supabase migration new so they sort after current history.`,
      );
    }
  }

  if (stats.size === 0) {
    errors.push(`${file}: file is empty.`);
    continue;
  }

  const contents = readFileSync(file, "utf8").trim();
  if (contents.length === 0) {
    errors.push(`${file}: file only contains whitespace.`);
    continue;
  }

  const scanContent = maskSqlCommentsAndLiterals(contents);
  if (scanContent.match(createIndexConcurrentlyPattern) !== null) {
    errors.push(
      `${file}: CREATE INDEX CONCURRENTLY is not allowed in managed Supabase migrations; use CREATE INDEX IF NOT EXISTS with bounded lock_timeout and statement_timeout instead.`,
    );
  }

  const tablesWithRls = findTableSet(scanContent, enableRlsPattern);
  for (const match of scanContent.matchAll(createTablePattern)) {
    const [schema, table] = extractTableIdentifier(match);
    if (!table || isSystemTable(table) || match.groups?.temp) {
      continue;
    }
    if (hasDisableComment(contents, match)) {
      continue;
    }
    if (!getExpectedTableKeys(schema, table).some((key) => tablesWithRls.has(key))) {
      errors.push(
        `${file}: CREATE TABLE ${match[0].trim()} missing ALTER TABLE ... ENABLE ROW LEVEL SECURITY.`,
      );
    }
  }
}

if (errors.length > 0) {
  reportErrorsAndExit();
}

console.log(`Validated ${files.length} changed SQL migration file(s).`);
