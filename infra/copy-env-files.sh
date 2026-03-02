#!/bin/bash

# copy-env-files.sh
# Run from the infra folder

source_dir="env_files"

# Ensure the source directory exists
if [[ ! -d "$source_dir" ]]; then
  echo "Source directory '$source_dir' does not exist."
  exit 1
fi

# Iterate over all .env.example files in the source directory
for file in "$source_dir"/*.env.example; do
  # Skip if no files match the pattern
  [[ -e "$file" ]] || continue

  target="${file%.example}" # Remove the .example suffix
  if [[ ! -e "$target" ]]; then
    cp "$file" "$target"
    echo "Created: $target"
  else
    echo "Skipped (already exists): $target"
  fi
done

echo -e "\n✅ Environment files ready in '$source_dir'"