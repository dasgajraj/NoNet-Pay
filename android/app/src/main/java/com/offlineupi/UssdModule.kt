package com.nonetpay

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.net.Uri
import android.os.Build
import android.telephony.TelephonyManager
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat

class UssdModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private val context: ReactApplicationContext = reactContext

    init {
        UssdAccessibilityBridge.attach(reactContext)
    }
    
    override fun getName(): String {
        return "UssdModule"
    }
    
    @RequiresApi(Build.VERSION_CODES.O)
    @ReactMethod
    fun dialUssd(ussdCode: String, promise: Promise) {
        try {
            val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            
            if (ActivityCompat.checkSelfPermission(context, Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) {
                promise.reject("PERMISSION_DENIED", "CALL_PHONE permission not granted")
                return
            }
            
            val callback = object : TelephonyManager.UssdResponseCallback() {
                override fun onReceiveUssdResponse(
                    telephonyManager: TelephonyManager,
                    request: String,
                    response: CharSequence
                ) {
                    sendEvent("ussdResponse", response.toString())
                }
                
                override fun onReceiveUssdResponseFailed(
                    telephonyManager: TelephonyManager,
                    request: String,
                    failureCode: Int
                ) {
                    val errorMsg = when(failureCode) {
                        TelephonyManager.USSD_ERROR_SERVICE_UNAVAIL -> "USSD service unavailable"
                        TelephonyManager.USSD_RETURN_FAILURE -> "USSD request failed"
                        -1 -> "USSD not supported by carrier or device"
                        else -> "USSD failed with code: $failureCode"
                    }
                    sendEvent("ussdError", errorMsg)
                }
            }
            
            telephonyManager.sendUssdRequest(ussdCode, callback, null)
            promise.resolve("USSD request sent")
            
        } catch (e: Exception) {
            promise.reject("USSD_ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun dialUssdWithIntent(ussdCode: String, promise: Promise) {
        try {
            val encodedUssd = Uri.encode(ussdCode)
            val intent = Intent(Intent.ACTION_CALL, Uri.parse("tel:$encodedUssd"))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            
            if (ActivityCompat.checkSelfPermission(context, Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) {
                promise.reject("PERMISSION_DENIED", "CALL_PHONE permission not granted")
                return
            }
            
            context.startActivity(intent)
            promise.resolve("USSD dialer opened")
            
        } catch (e: Exception) {
            promise.reject("USSD_ERROR", e.message)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ACCESSIBILITY_SETTINGS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        try {
            val enabledServices = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: ""

            val expectedService = "${context.packageName}/${UssdAccessibilityService::class.java.name}"
            val enabled = enabledServices
                .split(":")
                .any { it.equals(expectedService, ignoreCase = true) }

            promise.resolve(enabled)
        } catch (e: Exception) {
            promise.reject("ACCESSIBILITY_STATUS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun addListener(eventName: String?) {
    }

    @ReactMethod
    fun removeListeners(count: Int?) {
    }
    
    private fun sendEvent(eventName: String, data: String) {
        context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, data)
    }
}
