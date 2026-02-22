package com.nonetpay

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class LightSensorModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), SensorEventListener, LifecycleEventListener {

    private val ctx = reactContext
    private var sensorManager: SensorManager? = null
    private var lightSensor: Sensor? = null

    @Volatile
    private var lastLux: Float = -1f
    private var listening = false

    init {
        ctx.addLifecycleEventListener(this)
    }

    override fun getName(): String = "LightSensorModule"

    @ReactMethod
    fun startListening() {
        if (listening) return
        sensorManager = ctx.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
        lightSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_LIGHT)
        if (lightSensor != null) {
            sensorManager?.registerListener(this, lightSensor, SensorManager.SENSOR_DELAY_UI)
            listening = true
        }
    }

    @ReactMethod
    fun stopListening() {
        if (!listening) return
        sensorManager?.unregisterListener(this)
        listening = false
    }

    @ReactMethod
    fun getLux(promise: Promise) {
        promise.resolve(lastLux.toDouble())
    }

    @ReactMethod
    fun addListener(eventName: String?) {
    }

    @ReactMethod
    fun removeListeners(count: Int?) {
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event?.sensor?.type == Sensor.TYPE_LIGHT) {
            lastLux = event.values[0]
            val payload = Arguments.createMap()
            payload.putDouble("lux", lastLux.toDouble())
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("lightLevel", payload)
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
    }

    override fun onHostResume() {
    }

    override fun onHostPause() {
    }

    override fun onHostDestroy() {
        stopListening()
    }
}