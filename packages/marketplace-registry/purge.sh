#!/bin/bash

# Read and log all lines from registry.json into an array
IFS=$'\n' read -d '' -ra lines < registry.json

# Initialize purgeArray
purgeArray=()

# Iterate over the lines and check for the condition
for line in "${lines[@]}"; do
    if [[ $line == *"marketplace-manifest.json"* ]]; then
        # Remove "https://cdn.jsdelivr.net" from the line and add to purgeArray
        line_without_cdn=$(echo "$line" | sed 's#https://cdn.jsdelivr.net##')
        purgeArray+=("$line_without_cdn")
    fi
done

# Construct a JSON array from purgeArray
jsonArray=()
for item in "${purgeArray[@]}"; do
    jsonArray+=("$item")
done

# Convert the jsonArray to a JSON string
jsonString=$(printf '%s\n' "${jsonArray[@]}" )

# Send the JSON request to jsDelivr purge API
curl -X POST \
  https://purge.jsdelivr.net/ \
  -H 'content-type: application/json' \
  -d "{\"path\": [$jsonString]}"
