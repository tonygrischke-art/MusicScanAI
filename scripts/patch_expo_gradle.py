#!/usr/bin/env python3
import sys
import re

def patch_expo_application_gradle(gradle_file):
    with open(gradle_file, 'r') as f:
        content = f.read()
    
    # Remove the id 'expo-module-gradle-plugin' line from plugins block
    content = re.sub(r"id 'expo-module-gradle-plugin'\n?", '', content)
    
    # Add apply from after the plugins block
    # Use relative path from expo-application/android to expo-modules-core/android
    content = re.sub(
        r'(^plugins \{[^}]+\})',
        r'\1\n\napply from: "${project.rootDir}/../../expo-modules-core/android/ExpoModulesCorePlugin.gradle"',
        content,
        count=1,
        flags=re.MULTILINE
    )
    
    with open(gradle_file, 'w') as f:
        f.write(content)
    
    print(f"Patched {gradle_file}")

def patch_expo_modules_core_plugin(plugin_file):
    with open(plugin_file, 'r') as f:
        content = f.read()
    
    # Fix the "release" property issue in useExpoPublishing
    # The issue is that components.release is accessed before maven-publish plugin creates it
    # We need to defer the access or check if it exists
    content = re.sub(
        r'from components\.release',
        'from components.findByName("release") ?: components.main',
        content
    )
    
    with open(plugin_file, 'w') as f:
        f.write(content)
    
    print(f"Patched {plugin_file}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 patch_expo_gradle.py <path/to/expo-application/build.gradle> [path/to/ExpoModulesCorePlugin.gradle]")
        sys.exit(1)
    
    gradle_file = sys.argv[1]
    try:
        patch_expo_application_gradle(gradle_file)
    except Exception as e:
        print(f"Error patching expo-application: {e}")
        sys.exit(1)
    
    if len(sys.argv) > 2:
        plugin_file = sys.argv[2]
        try:
            patch_expo_modules_core_plugin(plugin_file)
        except Exception as e:
            print(f"Error patching ExpoModulesCorePlugin: {e}")
            sys.exit(1)