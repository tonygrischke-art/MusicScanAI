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