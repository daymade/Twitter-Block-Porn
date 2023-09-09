#!/bin/bash

set -e

inputDir="lists/snapshot"
intermediateFile="lists/lists.json"
allFile="lists/all.json"
blockFile="lists/block.json"

for file in "$inputDir"/*.json; do
  filename=$(basename "$file")
  outputFile="lists/$filename"

  echo $file
  # Extract necessary information and write to a snapshot file
  jq '[.[] | {id_str: .id_str, screen_name: .screen_name, name: .name}]' "$file" > "$file.snapshot"

  # Ensure the intermediate and output files exist
  touch "$outputFile"
  touch "$intermediateFile"

  # Merge the snapshot file with the current output file, ensuring uniqueness
  jq -s 'add | unique_by(.id_str)' "$outputFile" "$file.snapshot" > temp.json && mv temp.json "$outputFile"

  # Merge the output file with the intermediate file
  jq -s 'add | unique_by(.id_str)' "$outputFile" "$intermediateFile" > temp.json && mv temp.json "$intermediateFile"

done


# Ensure the files exist
touch "$allFile"
touch "$blockFile"

# Merge block file with intermediate file to create final output
jq -s 'add | unique_by(.id_str)' "$blockFile" "$intermediateFile" > temp.json && mv temp.json "$allFile"
