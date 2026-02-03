package com.offlineupi

import android.annotation.SuppressLint
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.graphics.PixelFormat
import android.os.Build
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class FloatingOverlayModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private var windowManager: WindowManager? = null
    private var floatingView: View? = null
    private var isFloatingViewVisible = false

    override fun getName(): String {
        return "FloatingOverlayModule"
    }

    @SuppressLint("ClickableViewAccessibility")
    @ReactMethod
    fun show(data: String) {
        currentActivity?.runOnUiThread {
            try {
                if (isFloatingViewVisible) {
                    hide()
                }

                windowManager = reactApplicationContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
                
                val inflater = reactApplicationContext.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
                floatingView = inflater.inflate(R.layout.floating_overlay, null)

                val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                } else {
                    WindowManager.LayoutParams.TYPE_PHONE
                }

                val params = WindowManager.LayoutParams(
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    layoutFlag,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                    PixelFormat.TRANSLUCENT
                )

                params.gravity = Gravity.TOP or Gravity.END
                params.x = 20
                params.y = 100

                windowManager?.addView(floatingView, params)
                isFloatingViewVisible = true

                // Set data text
                val dataTextView = floatingView?.findViewById<TextView>(R.id.dataText)
                dataTextView?.text = data

                // Copy button
                val copyButton = floatingView?.findViewById<Button>(R.id.copyButton)
                copyButton?.setOnClickListener {
                    val clipboard = reactApplicationContext.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    val clip = ClipData.newPlainText("UPI Data", data)
                    clipboard.setPrimaryClip(clip)
                    Toast.makeText(reactApplicationContext, "✅ Copied!", Toast.LENGTH_SHORT).show()
                }

                // Close button
                val closeButton = floatingView?.findViewById<ImageButton>(R.id.closeButton)
                closeButton?.setOnClickListener {
                    hide()
                }

                // Make draggable
                var initialX = 0
                var initialY = 0
                var initialTouchX = 0f
                var initialTouchY = 0f

                floatingView?.setOnTouchListener { view, event ->
                    when (event.action) {
                        MotionEvent.ACTION_DOWN -> {
                            initialX = params.x
                            initialY = params.y
                            initialTouchX = event.rawX
                            initialTouchY = event.rawY
                            true
                        }
                        MotionEvent.ACTION_MOVE -> {
                            params.x = initialX + (event.rawX - initialTouchX).toInt()
                            params.y = initialY + (event.rawY - initialTouchY).toInt()
                            windowManager?.updateViewLayout(floatingView, params)
                            true
                        }
                        else -> false
                    }
                }

            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    @ReactMethod
    fun hide() {
        currentActivity?.runOnUiThread {
            try {
                if (isFloatingViewVisible && floatingView != null) {
                    windowManager?.removeView(floatingView)
                    floatingView = null
                    isFloatingViewVisible = false
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
