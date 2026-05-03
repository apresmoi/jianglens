#!/usr/bin/env node
import fs from "node:fs/promises";
import process from "node:process";

const sourceRefPattern = /\b(?:video:[a-z0-9][a-z0-9-]*@transcript:v[0-9]+#seg-[0-9]{4}|article:[a-z0-9][a-z0-9-]*@text:v[0-9]+#p-[0-9]{4}|interview:[a-z0-9][a-z0-9-]*@transcript:v[0-9]+#seg-[0-9]{4})\b/;
const requiredArrays = [
  "interactions",
  "speaker_notes",
  "claims",
  "signature_moments",
  "glossary_terms",
  "chronology_notes",
  "uncertainty_notes",
];
const interactionKinds = new Set([
  "monologue",
  "question",
  "answer",
  "exchange",
  "reading-quoted-material",
  "unclear",
]);
const confidenceValues = new Set(["high", "medium", "low"]);

function usage() {
  return `Usage:
  node ops/scripts/validate-agent-pass.mjs content/workflow/proposals/.../*.semantic.json`;
}

function validateRefs(errors, filePath, objectPath, refs) {
  if (!Array.isArray(refs) || refs.length === 0) {
    errors.push(`${filePath}: ${objectPath}.refs must be a non-empty array`);
    return;
  }
  for (const ref of refs) {
    if (typeof ref !== "string" || !sourceRefPattern.test(ref)) {
      errors.push(`${filePath}: ${objectPath}.refs contains malformed source ref ${JSON.stringify(ref)}`);
    }
  }
}

function validateConfidence(errors, filePath, objectPath, value) {
  if (!confidenceValues.has(value)) {
    errors.push(`${filePath}: ${objectPath}.confidence must be high, medium, or low`);
  }
}

async function validateFile(filePath) {
  const errors = [];
  let data;
  try {
    data = JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    return [`${filePath}: invalid JSON (${error.message})`];
  }

  for (const key of ["packet_id", "source_id"]) {
    if (!data[key] || typeof data[key] !== "string") errors.push(`${filePath}: missing string ${key}`);
  }

  for (const key of requiredArrays) {
    if (!Array.isArray(data[key])) errors.push(`${filePath}: ${key} must be an array`);
  }

  for (const [index, item] of (data.interactions || []).entries()) {
    validateRefs(errors, filePath, `interactions[${index}]`, item.refs);
    if (!interactionKinds.has(item.kind)) errors.push(`${filePath}: interactions[${index}].kind is invalid`);
    validateConfidence(errors, filePath, `interactions[${index}]`, item.confidence);
  }

  for (const [groupName, requiredConfidence] of [
    ["speaker_notes", true],
    ["claims", true],
    ["signature_moments", true],
    ["glossary_terms", true],
    ["chronology_notes", true],
    ["uncertainty_notes", false],
  ]) {
    for (const [index, item] of (data[groupName] || []).entries()) {
      validateRefs(errors, filePath, `${groupName}[${index}]`, item.refs);
      if (requiredConfidence) validateConfidence(errors, filePath, `${groupName}[${index}]`, item.confidence);
    }
  }

  return errors;
}

async function main() {
  const files = process.argv.slice(2);
  if (!files.length) throw new Error(usage());

  const errors = [];
  for (const file of files) errors.push(...await validateFile(file));

  if (errors.length) {
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${files.length} agent semantic output file(s).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
