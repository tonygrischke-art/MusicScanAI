#!/usr/bin/env python3
"""Patch android/app/build.gradle to add Hermes/JSC dependency configuration."""

import re
import sys

def patch_build_gradle(build_gradle_path):
    with open(build_gradle_path, 'r') as f:
        content = f.read()

    # Remove any existing hermesEnabled references
    content = re.sub(r'.*hermesEnabled.*\n', '', content)

    # Find the closing brace of android block and add afterEvaluate after it
    pattern = r'(^})'
    replacement = r'''\1

// Configure Hermes/JSC dependency after project evaluation
afterEvaluate {
    def useHermes = project.hasProperty('expo.jsEngine') ? project.property('expo.jsEngine') == "hermes" : true
    if (useHermes) {
        dependencies {
            implementation("com.facebook.react:hermes-android")
        }
    } else {
        dependencies {
            implementation jscFlavor
        }
    }
}'''

    new_content = re.sub(pattern, replacement, content, count=1, flags=re.MULTILINE)

    if new_content == content:
        print("WARNING: Pattern not found, trying alternative approach")
        # Try to find the end of android block
        alt_pattern = r'(android\s*\{[^}]+\})'
        alt_replacement = r'\1\n\n// Configure Hermes/JSC dependency after project evaluation\nafterEvaluate {\n    def useHermes = project.hasProperty('\''expo.jsEngine'\'') ? project.property('\''expo.jsEngine'\'') == "hermes" : true\n    if (useHermes) {\n        dependencies {\n            implementation("com.facebook.react:hermes-android")\n        }\n    } else {\n        dependencies {\n            implementation jscFlavor\n        }\n    }\n}'
        new_content = re.sub(alt_pattern, alt_replacement, content, count=1, flags=re.DOTALL)

    with open(build_gradle_path, 'w') as f:
        f.write(new_content)
    
    print(f"Patched {build_gradle_path} successfully")

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python3 patch_build_gradle.py <path/to/build.gradle>")
        sys.exit(1)
    patch_build_gradle(sys.argv[1])