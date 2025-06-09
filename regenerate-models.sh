#!/bin/bash

# Script to regenerate CloudFormation models across all resource provider packages
# This script runs 'cfn generate' in each package that has the command defined

echo "🔄 Regenerating CloudFormation models across all packages..."
echo

# Find all package.json files that contain "cfn generate" and run the command in each directory
find . -name "package.json" -not -path "*/node_modules/*" -exec grep -l "cfn generate" {} + | while read -r file; do
    dir=$(dirname "$file")
    package_name=$(basename "$dir")
    echo "📦 Regenerating models in: $dir"
    
    (cd "$dir" && cfn generate)
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully regenerated models for $package_name"
    else
        echo "❌ Failed to regenerate models for $package_name"
    fi
    echo
done

echo "🎉 Model regeneration completed!"
echo
echo "📄 Note: The generated models.ts files contain the comment:"
echo "   // This is a generated file. Modifications will be overwritten."
echo
echo "💡 Alternative commands:"
echo "   • Run for all packages with build: npx lerna run prepack --stream"
echo "   • Run cfn generate in specific package: cd <package-dir> && cfn generate"