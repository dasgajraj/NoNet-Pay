package com.nonetpay

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

object UssdAccessibilityBridge {
    private var reactContext: ReactApplicationContext? = null

    fun attach(context: ReactApplicationContext) {
        reactContext = context
    }

    fun emitText(
        text: String,
        packageName: String?,
        className: String?
    ) {
        val context = reactContext ?: return
        val payload = Arguments.createMap().apply {
            putString("text", text)
            putString("packageName", packageName)
            putString("className", className)
            putDouble("timestamp", System.currentTimeMillis().toDouble())
        }

        context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("ussdAccessibilityText", payload)
    }
}
