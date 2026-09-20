import os
import glob

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
        content = content.replace('android {', 'android {\n    compileSdkVersion 36', 1)
        print(f"    Added compileSdkVersion 36")
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

# Patch root build.gradle to upgrade AGP
root_gradle = 'android/build.gradle'
print(f"\n=== Checking root build.gradle ===")
print(f"  Exists: {os.path.isfile(root_gradle)}")
if os.path.isfile(root_gradle):
    with open(root_gradle, 'r') as fp:
        content = fp.read()
    # Upgrade AGP from 8.6.0 to 8.9.1
    if '8.6.0' in content and 'com.android.application' in content:
        content = content.replace('8.6.0', '8.9.1')
        print(f"  Upgraded AGP to 8.9.1")
    with open(root_gradle, 'w') as fp:
        fp.write(content)

# Patch gradle.properties for Android Gradle Plugin version
gradle_props = 'android/gradle.properties'
print(f"\n=== Checking gradle.properties ===")
print(f"  Exists: {os.path.isfile(gradle_props)}")
if os.path.isfile(gradle_props):
    with open(gradle_props, 'r') as fp:
        content = fp.read()
    if 'androidGradlePluginVersion' in content:
        content = content.replace('androidGradlePluginVersion=8.6.0', 'androidGradlePluginVersion=8.9.1')
        print(f"  Updated androidGradlePluginVersion to 8.9.1")
    with open(gradle_props, 'w') as fp:
        fp.write(content)

# Patch app build.gradle to use compileSdk 36
app_gradle = 'android/app/build.gradle'
print(f"\n=== Checking app build.gradle ===")
print(f"  Exists: {os.path.isfile(app_gradle)}")
if os.path.isfile(app_gradle):
    with open(app_gradle, 'r') as fp:
        content = fp.read()
    if 'compileSdkVersion' in content:
        content = content.replace('compileSdkVersion 35', 'compileSdkVersion 36')
        content = content.replace('compileSdkVersion 34', 'compileSdkVersion 36')
        print(f"  Updated compileSdkVersion to 36")
    else:
        content = content.replace('android {', 'android {\n    compileSdkVersion 36', 1)
        print(f"  Added compileSdkVersion 36")
    with open(app_gradle, 'w') as fp:
        fp.write(content)

print("=== Done ===")