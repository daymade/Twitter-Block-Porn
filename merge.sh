#!/bin/bash
set -euo pipefail

inputDir="lists/snapshot"
intermediateFile="lists/lists.json"
allFile="lists/all.json"
blockFile="lists/block.json"
staging=$(mktemp -d "${TMPDIR:-/tmp}/twitter-block-porn-merge.XXXXXX")
trap 'rm -rf -- "$staging"' EXIT
mkdir -p "$staging/inputs" "$staging/outputs"

fail () { echo "List merge failed: $*" >&2; exit 1; }
inputPaths=()
inputCopies=()
inputPresent=()
outputPaths=()
outputCopies=()

# Freeze all inputs before any output is changed. Missing historical files are
# first-use empty arrays; an existing malformed or empty file is never repaired.
capture_input () {
  local file="$1" copy="$2" required="$3" present=0
  if [[ -e "$file" || -L "$file" ]]; then
    [[ -f "$file" ]] || fail "input is not a regular file: $file"
    cp "$file" "$copy" || fail "cannot freeze input: $file"
    present=1
  else
    [[ "$required" == 0 ]] || fail "input disappeared: $file"
    printf '[]\n' > "$copy"
  fi
  inputPaths+=("$file")
  inputCopies+=("$copy")
  inputPresent+=("$present")
}
validate_input () {
  jq -s -e 'if length != 1 then false else .[0] |
    if type != "array" then false else all(.[];
      if type != "object" then false
      elif (.id_str | type) != "string" then false
      else (.id_str | test("^[0-9]+$")) end) end end' "$1" > /dev/null || fail "invalid account array: $2"
}
queue_output () { outputPaths+=("$1"); outputCopies+=("$2"); }

shopt -s nullglob
snapshots=("$inputDir"/*.json)
for ((i=0; i<${#snapshots[@]}; i++)); do
  file="${snapshots[$i]}"
  filename=$(basename "$file")
  [[ "$filename" =~ ^[0-9]+\.json$ ]] || fail "snapshot filename must be a numeric list ID: $filename"
  capture_input "$file" "$staging/inputs/snapshot-$i.json" 1
  capture_input "lists/$filename" "$staging/inputs/history-$i.json" 0
done
capture_input "$intermediateFile" "$staging/inputs/intermediate.json" 0
capture_input "$blockFile" "$staging/inputs/block.json" 0
for ((i=0; i<${#inputCopies[@]}; i++)); do
  validate_input "${inputCopies[$i]}" "${inputPaths[$i]}"
done

cp "$staging/inputs/intermediate.json" "$staging/current-intermediate.json"
for ((i=0; i<${#snapshots[@]}; i++)); do
  file="${snapshots[$i]}"
  filename=$(basename "$file")
  projection="$staging/outputs/snapshot-$i.json"
  output="$staging/outputs/list-$i.json"
  jq '[.[] | {id_str: .id_str, screen_name: .screen_name, name: .name}]' "$staging/inputs/snapshot-$i.json" > "$projection" || fail "cannot project snapshot: $file"
  jq -s 'add | unique_by(.id_str)' "$staging/inputs/history-$i.json" "$projection" > "$output" || fail "cannot merge list: $file"
  jq -s 'add | unique_by(.id_str)' "$output" "$staging/current-intermediate.json" > "$staging/next-intermediate.json" || fail "cannot merge history: $file"
  mv "$staging/next-intermediate.json" "$staging/current-intermediate.json"
  queue_output "$file.snapshot" "$projection"
  queue_output "lists/$filename" "$output"
done
jq -s 'add | unique_by(.id_str)' "$staging/inputs/block.json" "$staging/current-intermediate.json" > "$staging/outputs/all.json" || fail "cannot merge complete list"
queue_output "$intermediateFile" "$staging/current-intermediate.json"
queue_output "$allFile" "$staging/outputs/all.json"

# Refuse mixed batches if a source changed or a first-use history appeared while
# the batch was calculated. This is a pre-publish check, not a filesystem lock.
currentSnapshots=("$inputDir"/*.json)
[[ ${#currentSnapshots[@]} == ${#snapshots[@]} ]] || fail "snapshot set changed"
for ((i=0; i<${#snapshots[@]}; i++)); do
  [[ "${snapshots[$i]}" == "${currentSnapshots[$i]}" ]] || fail "snapshot set changed"
done
for ((i=0; i<${#inputPaths[@]}; i++)); do
  file="${inputPaths[$i]}"
  if [[ "${inputPresent[$i]}" == 1 ]]; then
    [[ -f "$file" ]] && cmp -s "$file" "${inputCopies[$i]}" || fail "input changed: $file"
  else
    [[ ! -e "$file" && ! -L "$file" ]] || fail "first-use history appeared: $file"
  fi
done

# Check every publication target before the first rename. mv otherwise treats
# a directory as a destination container and can falsely report a valid publish.
for destination in "${outputPaths[@]}"; do
  if [[ -e "$destination" || -L "$destination" ]]; then
    [[ -f "$destination" ]] || fail "output is not a regular file: $destination"
  fi
done

# Validation and computation have succeeded for the whole batch. A publication
# I/O failure is reported; multiple file renames are not an atomic transaction.
for ((i=0; i<${#outputPaths[@]}; i++)); do
  destination="${outputPaths[$i]}"
  staged="${outputCopies[$i]}"
  if [[ -f "$destination" ]] && cmp -s "$destination" "$staged"; then continue; fi
  mv "$staged" "$destination" || fail "cannot publish output: $destination"
done
