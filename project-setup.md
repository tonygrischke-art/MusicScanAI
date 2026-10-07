# MusicScanAI Project Setup - Brother's Desktop

This project was set up on the brother's desktop at `100.126.45.120`.

## Project Structure
```
MusicScanAI/
├── settings.gradle
├── build.gradle (root)
├── app/
│   ├── build.gradle
│   ├── src/main/AndroidManifest.xml
│   ├── src/main/java/com/musicscanai/app/MusicScanAI.java
│   ├── src/main/res/layout/main.xml
│   └── src/main/res/values/strings.xml
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
└── gradle-8.10.2/  (downloaded to C:\Tools\gradle8.10.2)
```

## Build Instructions

### On Brother's Desktop (Windows):

1. **Ensure Android SDK is available** at `C:\Android\android-sdk`
   - build-tools: 34.0.0, 35.0.0
   - platforms: android-35, android-36
   - cmdline-tools: latest

2. **Gradle is installed** at `C:\Tools\gradle8.10.2\gradle-8.10.2`

3. **Set environment variables** (or use in command):
   - `GRADLE_HOME=C:\Tools\gradle8.10.2\gradle-8.10.2`
   - Add `%GRADLE_HOME%\bin` to PATH

4. **Build the debug APK**:
   ```cmd
   cd C:\Users\xithi\Projects\MusicScanAI
   C:\Tools\gradle8.10.2\gradle-8.10.2\bin\gradle :app:assembleDebug --no-daemon
   ```

5. **Install on phone** (via ADB/Tailscale):
   ```cmd
   # Find phone IP via Tailscale
   # Install APK
   rish -c "pm install -r /sdcard/Download/app-debug.apk"
   ```

## Files Created on Desktop

### `settings.gradle`
```groovy
rootProject.name = "MusicScanAI"
include ':app'
```

### `build.gradle` (root - top-level)
```groovy
plugins {
    id 'com.android.application'
}

android {
    namespace 'com.musicscanai.app'
    compileSdk 35
    defaultConfig {
        applicationId "com.musicscanai.app"
        minSdk 24
        targetSdk 35
        versionCode 1
        versionName "1.0"
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}
```

### `app/build.gradle`
```groovy
plugins {
    id 'com.android.application'
}

android {
    namespace 'com.musicscanai.app'
    compileSdk 35
    defaultConfig {
        applicationId "com.musicscanai.app"
        minSdk 24
        targetSdk 35
        versionCode 1
        versionName "1.0"
    }
    
    buildTypes {
        release {
            minifyEnabled false
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}
```

### `app/src/main/AndroidManifest.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.musicscanai.app">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.MusicScanAI">
        
        <activity
            android:name=".MusicScanAI"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
    </application>
</manifest>
```

### `app/src/main/java/com/musicscanai/app/MusicScanAI.java`
```java
package com.musicscanai.app;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;

public class MusicScanAI extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);
        
        TextView textView = findViewById(R.id.text_view);
        textView.setText("Music Scan AI - Ready");
        
        Toast.makeText(this, "Music Scan AI Started", Toast.LENGTH_SHORT).show();
    }
}
```

### `app/src/main/res/layout/main.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:padding="16dp">
    
    <TextView
        android:id="@+id/text_view"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Music Scan AI"
        android:textSize="24sp" />
    
    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Music Recognition Feature"
        android:textSize="18sp" />
</LinearLayout>
```

### `app/src/main/res/values/strings.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">MusicScanAI</string>
</resources>
```