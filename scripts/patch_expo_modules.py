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

# Patch libs.versions.toml to upgrade AGP and compileSdk
libs_toml = 'node_modules/react-native/gradle/libs.versions.toml'
print(f"\n=== Checking libs.versions.toml ===")
print(f"  Exists: {os.path.isfile(libs_toml)}")
if os.path.isfile(libs_toml):
    with open(libs_toml, 'r') as fp:
        content = fp.read()
    print(f"  Original content snippet (agp line):")
    for line in content.split('\n'):
        if 'agp' in line or 'compileSdk' in line or 'targetSdk' in line or 'buildTools' in line:
            print(f"    {line.strip()}")
    # Upgrade AGP from 8.6.0 to 8.9.1
    if 'agp = "8.6.0"' in content:
        content = content.replace('agp = "8.6.0"', 'agp = "8.9.1"')
        print(f"  Upgraded AGP to 8.9.1")
    else:
        print(f"  agp = \"8.6.0\" NOT FOUND!")
    # Upgrade compileSdk from 35 to 36
    if 'compileSdk = "35"' in content:
        content = content.replace('compileSdk = "35"', 'compileSdk = "36"')
        print(f"  Upgraded compileSdk to 36")
    else:
        print(f"  compileSdk = \"35\" NOT FOUND!")
    # Upgrade targetSdk from 34 to 35
    if 'targetSdk = "34"' in content:
        content = content.replace('targetSdk = "34"', 'targetSdk = "35"')
        print(f"  Upgraded targetSdk to 35")
    else:
        print(f"  targetSdk = \"34\" NOT FOUND!")
    # Upgrade buildTools from 35.0.0 to 36.0.0
    if 'buildTools = "35.0.0"' in content:
        content = content.replace('buildTools = "35.0.0"', 'buildTools = "36.0.0"')
        print(f"  Upgraded buildTools to 36.0.0")
    else:
        print(f"  buildTools = \"35.0.0\" NOT FOUND!")
    with open(libs_toml, 'w') as fp:
        fp.write(content)
    # Verify after write
    with open(libs_toml, 'r') as fp:
        content = fp.read()
    print(f"  After write content snippet:")
    for line in content.split('\n'):
        if 'agp' in line or 'compileSdk' in line or 'targetSdk' in line or 'buildTools' in line:
            print(f"    {line.strip()}")

# Patch root build.gradle to use compileSdkVersion 36
root_gradle = 'android/build.gradle'
print(f"\n=== Checking root build.gradle ===")
print(f"  Exists: {os.path.isfile(root_gradle)}")
if os.path.isfile(root_gradle):
    with open(root_gradle, 'r') as fp:
        content = fp.read()
    with open(root_gradle, 'w') as fp:
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