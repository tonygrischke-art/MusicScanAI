import os
import glob

expo_modules = glob.glob('node_modules/expo-*/android/build.gradle') + glob.glob('node_modules/@expo/*/android/build.gradle')
for f in expo_modules:
    if not os.path.isfile(f):
        continue
    with open(f, 'r') as fp:
        content = fp.read()
    if 'expo-module-gradle-plugin' not in content:
        continue
    print(f"Patching {f}")
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        if 'expo-module-gradle-plugin' in line:
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
            in_plugins = False
    content = '\n'.join(new_lines)
    if 'compileSdkVersion' not in content:
        content = content.replace('android {', 'android {\n    compileSdkVersion 34', 1)
    with open(f, 'w') as fp:
        fp.write(content)

# Also patch expo-modules-core build.gradle for hermesEnabled reference
core_gradle = 'node_modules/expo-modules-core/android/build.gradle'
if os.path.isfile(core_gradle):
    with open(core_gradle, 'r') as fp:
        content = fp.read()
    # Fix the hermesEnabled reference on app project - exact match
    old = 'USE_HERMES = appProject?.hermesEnabled?.toBoolean() || appProject?.ext?.react?.enableHermes?.toBoolean()'
    new = 'USE_HERMES = (appProject?.ext?.react?.enableHermes?.toBoolean() ?: false)'
    if old in content:
        content = content.replace(old, new)
        print(f"Patched {core_gradle} for hermesEnabled")
    else:
        print(f"Pattern not found in {core_gradle}")
    with open(core_gradle, 'w') as fp:
        fp.write(content)

print("Patched all expo modules")