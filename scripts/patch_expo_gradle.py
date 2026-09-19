#!/usr/bin/env python3
import sys
import re

def patch_expo_application_gradle(gradle_file):
    with open(gradle_file, 'r') as f:
        content = f.read()
    
    # Remove the id 'expo-module-gradle-plugin' line from plugins block
    content = re.sub(r"id 'expo-module-gradle-plugin'\n?", '', content)
    
    # Add apply from after the plugins block
    content = re.sub(
        r'(^plugins \{[^}]+\})',
        r'\1\n\napply from: "${project.rootDir}/node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle"',
        content,
        count=1,
        flags=re.MULTILINE
    )
    
    with open(gradle_file, 'w') as f:
        f.write(content)
    
    print(f"Patched {gradle_file}")

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python3 patch_expo_gradle.py <path/to/build.gradle>")
        sys.exit(1)
    
    gradle_file = sys.argv[1]
    try:
        patch_expo_application_gradle(gradle_file)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)