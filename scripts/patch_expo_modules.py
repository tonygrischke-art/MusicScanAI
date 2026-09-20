import os
import glob
import re

print("=== Patching expo modules ===")
expo_modules = glob.glob('node_modules/expo-*/android/build.gradle') + glob.glob('node_modules/@expo/*/android/build.gradle')
print(f"Found {len(expo_modules)} expo module build.gradle files")
for f in expo_modules:
    if not os.path.isfile(f):
        print(f"  SKIP (not file): {f}")
        continue
    with open(f, 'r') as fp:
        content = fp.read()
    if 'expo-module-gradle-plugin' not in content:
        print(f"  SKIP (no plugin): {f}")
        continue
    print(f"  PATCHING: {f}")
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        if 'expo-module-gradle-plugin' in line:
            print(f"    Removed: {line.strip()}")
            continue
        new_lines.append(line)
    content = '\n'.join(new_lines)
    lines = content.split('\n')
    new_lines = []
    in_plugins = False
    for line in lines:
        new_lines.append(line)
        if line.strip().startswith('plugins {'):
            in_plugins = True
        elif in_plugins and line.strip() == '}':
            new_lines.append('apply from: "${project.rootDir}/../node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle"')
            print(f"    Added apply after plugins block")
            in_plugins = False
    content = '\n'.join(new_lines)
    if 'compileSdkVersion' not in content:
        content = content.replace('android {', 'android {\n    compileSdkVersion 35', 1)
        print(f"    Added compileSdkVersion 35")
    with open(f, 'w') as fp:
        fp.write(content)

# Also patch expo-modules-core build.gradle for hermesEnabled reference
core_gradle = 'node_modules/expo-modules-core/android/build.gradle'
print(f"\n=== Checking expo-modules-core ===")
print(f"  Exists: {os.path.isfile(core_gradle)}")
if os.path.isfile(core_gradle):
    with open(core_gradle, 'r') as fp:
        content = fp.read()
    old = 'USE_HERMES = appProject?.hermesEnabled?.toBoolean() || appProject?.ext?.react?.enableHermes?.toBoolean()'
    new = 'USE_HERMES = (appProject?.ext?.react?.enableHermes?.toBoolean() ?: false)'
    if old in content:
        content = content.replace(old, new)
        print(f"  PATTERN FOUND - patching hermesEnabled")
    else:
        print(f"  PATTERN NOT FOUND!")
        for i, line in enumerate(content.split('\n'), 1):
            if 'hermesEnabled' in line or 'USE_HERMES' in line:
                print(f"    Line {i}: {line.strip()}")
    with open(core_gradle, 'w') as fp:
        fp.write(content)

# Also patch react-native-reanimated build.gradle for hermesEnabled reference
reanimated_gradle = 'node_modules/react-native-reanimated/android/build.gradle'
print(f"\n=== Checking react-native-reanimated ===")
print(f"  Exists: {os.path.isfile(reanimated_gradle)}")
if os.path.isfile(reanimated_gradle):
    with open(reanimated_gradle, 'r') as fp:
        content = fp.read()
    old = 'appProject?.hermesEnabled?.toBoolean() || appProject?.ext?.react?.enableHermes?.toBoolean()'
    new = '(appProject?.ext?.react?.enableHermes?.toBoolean() ?: false)'
    if old in content:
        content = content.replace(old, new)
        print(f"  PATTERN FOUND - patching hermesEnabled")
    else:
        print(f"  PATTERN NOT FOUND!")
        for i, line in enumerate(content.split('\n'), 1):
            if 'hermesEnabled' in line:
                print(f"    Line {i}: {line.strip()}")
    with open(reanimated_gradle, 'w') as fp:
        fp.write(content)

# Patch libs.versions.toml to use androidx.core 1.15.0 (compatible with AGP 8.6.0 / compileSdk 35)
libs_toml = 'node_modules/react-native/gradle/libs.versions.toml'
print(f"\n=== Checking libs.versions.toml ===")
print(f"  Exists: {os.path.isfile(libs_toml)}")
if os.path.isfile(libs_toml):
    with open(libs_toml, 'r') as fp:
        content = fp.read()
    print(f"  Original content snippet (all androidx lines):")
    for line in content.split('\n'):
        if 'androidx' in line:
            print(f"    {line.strip()}")
    # Replace any androidx version that's 1.17.0 with 1.15.0
    # The format is: name = "1.17.0" or name = "1.17.0" or name="1.17.0"
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        if 'androidx' in line and '1.17.0' in line:
            new_line = line.replace('1.17.0', '1.15.0')
            print(f"  Replaced: {line.strip()} -> {new_line.strip()}")
            new_lines.append(new_line)
        else:
            new_lines.append(line)
    content = '\n'.join(new_lines)
    with open(libs_toml, 'w') as fp:
        fp.write(content)
    # Verify after write
    with open(libs_toml, 'r') as fp:
        content = fp.read()
    print(f"  After write content snippet (all androidx lines):")
    for line in content.split('\n'):
        if 'androidx' in line:
            print(f"    {line.strip()}")

# Patch app build.gradle to ensure compileSdk is 35
app_gradle = 'android/app/build.gradle'
print(f"\n=== Checking app build.gradle ===")
print(f"  Exists: {os.path.isfile(app_gradle)}")
if os.path.isfile(app_gradle):
    with open(app_gradle, 'r') as fp:
        content = fp.read()
    if 'compileSdkVersion 36' in content:
        content = content.replace('compileSdkVersion 36', 'compileSdkVersion 35')
        print(f"  Changed compileSdkVersion to 35")
    elif 'compileSdkVersion' not in content:
        content = content.replace('android {', 'android {\n    compileSdkVersion 35', 1)
        print(f"  Added compileSdkVersion 35")
    with open(app_gradle, 'w') as fp:
        fp.write(content)

print("=== Done ===")