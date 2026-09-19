const fs = require('fs');
const path = require('path');

const gradlePath = path.join(__dirname, '../android/build.gradle');
if (fs.existsSync(gradlePath)) {
    let content = fs.readFileSync(gradlePath, 'utf8');
    const patch = `
subprojects {
    afterEvaluate { project ->
        if (project.hasProperty("android")) {
            project.android {
                def compileSdkVer = rootProject.hasProperty('compileSdkVersion') ? rootProject.ext.compileSdkVersion : 35;
                def targetSdkVer = rootProject.hasProperty('targetSdkVersion') ? rootProject.ext.targetSdkVersion : 35;
                if (ext.has("compileSdkVersion") && compileSdkVersion == null) {
                    compileSdkVersion compileSdkVer;
                }
                if (ext.has("targetSdkVersion") && targetSdkVersion == null) {
                    targetSdkVersion targetSdkVer;
                }
            }
        }
    }
}
`;
    if (!content.includes('subprojects {')) {
        fs.writeFileSync(gradlePath, content + '\n' + patch, 'utf8');
        console.log('Successfully patched android/build.gradle');
    }
}