package com.nonetpay

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class UssdAccessibilityService : AccessibilityService() {

    private var lastText: String = ""
    private var lastEmitAt: Long = 0L

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) {
            return
        }

        val packageName = event.packageName?.toString()
        if (!isRelevantPackage(packageName)) {
            return
        }

        val collectedText = linkedSetOf<String>()
        event.text
            ?.mapNotNull { it?.toString()?.trim() }
            ?.filter { it.isNotEmpty() }
            ?.forEach { collectedText.add(it) }

        collectNodeText(event.source, collectedText)
        val text = collectedText.joinToString("\n").trim()
        if (text.isEmpty()) {
            return
        }

        val now = System.currentTimeMillis()
        if (text == lastText && now - lastEmitAt < 1200L) {
            return
        }

        lastText = text
        lastEmitAt = now
        UssdAccessibilityBridge.emitText(text, packageName, event.className?.toString())
    }

    override fun onInterrupt() {
    }

    private fun isRelevantPackage(packageName: String?): Boolean {
        if (packageName.isNullOrBlank()) {
            return false
        }

        return packageName.contains("dialer") ||
            packageName.contains("phone") ||
            packageName.contains("telecom") ||
            packageName.contains("callui")
    }

    private fun collectNodeText(node: AccessibilityNodeInfo?, texts: MutableSet<String>) {
        if (node == null) {
            return
        }

        val text = node.text?.toString()?.trim()
        if (!text.isNullOrEmpty()) {
            texts.add(text)
        }

        val contentDescription = node.contentDescription?.toString()?.trim()
        if (!contentDescription.isNullOrEmpty()) {
            texts.add(contentDescription)
        }

        for (index in 0 until node.childCount) {
            collectNodeText(node.getChild(index), texts)
        }
    }
}
