# OfflineUPI

A mobile payment solution for sending and receiving money through UPI without requiring internet connectivity.

## Overview

Traditional UPI payment apps require an active internet connection to process transactions. This becomes a challenge in areas with poor network coverage or when data services are unavailable. OfflineUPI solves this problem by leveraging USSD-based payments, which work over basic cellular networks without needing mobile data or WiFi.

## The Challenge

While USSD codes (like dialing *99# on your phone) enable offline UPI transactions, they come with significant usability barriers:

- Complex multi-digit codes that are difficult to remember
- Manual navigation through multiple menu options
- Tedious data entry on number pads
- High chance of errors during manual input
- Time-consuming process for frequent transactions

Most users find the native USSD experience cumbersome, which limits adoption despite its offline capability.

## The Solution

OfflineUPI simplifies the entire process by providing a user-friendly interface that handles the complexity behind the scenes. Instead of memorizing codes or navigating menus manually, users interact with a straightforward mobile app that automates the technical aspects while maintaining the offline functionality.

## Key Features

### Request Money
Two convenient methods to request payments:

**UPI ID Method**
- Enter the amount you want to receive
- Your UPI ID is automatically copied to clipboard
- Share it with the payer through any messaging app
- The app initiates the request automatically

**Mobile Number Method**
- Enter the recipient's mobile number
- Specify the amount
- Direct request without any manual copying

### Send Money
Smart payment detection that adapts to your input:

**UPI ID Payments**
- Paste or enter any UPI ID
- System automatically detects the UPI format
- One-tap to copy and process the payment

**Mobile Number Payments**
- Simply enter the 10-digit mobile number
- Automatic recognition and direct processing
- No additional steps needed

### QR Code Scanner
Fast and error-free payment initiation:

- Scan any UPI QR code
- Instant extraction of payment details
- Automatic navigation to payment screen
- Pre-filled recipient information

### Accessibility Service
Background automation that makes transactions seamless:

- Handles system dialogs automatically
- Processes responses without user intervention
- Reduces steps from 8-10 to just 2-3
- Works entirely in the background

## Requirements

### Device Requirements
- Android device running Android 7.0 or higher
- Active mobile number linked to UPI
- Cellular network coverage (no internet required)

### Bank Requirements
- UPI-enabled bank account
- UPI PIN set up for your account
- Bank should support USSD-based UPI transactions

### Permissions
The app requires the following permissions to function:

**Accessibility Service**
- Required for automating USSD dialog interactions
- Must be manually enabled in device settings
- Does not access any personal data or other apps

**Camera**
- Required for QR code scanning only
- Can be denied if you don't use QR payments
- Only activates when scanning feature is used

**Vibration**
- Provides haptic feedback for user actions
- Optional permission for enhanced user experience

## Installation

1. Download the APK file to your Android device
2. Enable "Install from Unknown Sources" in your device settings
3. Open the APK file and follow installation prompts
4. Launch OfflineUPI from your app drawer

### First-Time Setup

After installation, enable the Accessibility Service:

1. Open OfflineUPI and navigate to Settings
2. Tap on "Enable Accessibility Service"
3. Find OfflineUPI in the accessibility services list
4. Toggle the switch to enable
5. Confirm the permission dialog

The app is now ready to use.

## Usage Guide

### Requesting Money

**Using UPI ID:**
1. Open the "Request Money" screen
2. Enter the amount you want to receive
3. Tap "Copy UPI ID & Request"
4. Your UPI ID is copied automatically
5. Share the copied ID with the payer
6. Enter your UPI PIN when prompted to confirm the request

**Using Mobile Number:**
1. Open the "Request Money" screen
2. Enter the payer's mobile number
3. Enter the amount
4. Tap "Request via Mobile Number"
5. Enter your UPI PIN when prompted

### Sending Money

**Using UPI ID:**
1. Open the "Send Money" screen
2. Enter or paste the recipient's UPI ID
3. Enter the amount to send
4. Tap "Copy UPI ID & Send"
5. Enter your UPI PIN when prompted to complete payment

**Using Mobile Number:**
1. Open the "Send Money" screen
2. Enter the recipient's 10-digit mobile number
3. Enter the amount to send
4. Tap "Send via Mobile Number"
5. Enter your UPI PIN when prompted

**Using QR Code:**
1. Tap the "Scan UPI QR Code" button on the home screen
2. Point your camera at any UPI QR code
3. Wait for automatic recognition (you'll feel a vibration)
4. The Send Money screen opens with pre-filled details
5. Verify the recipient and amount
6. Complete the transaction with your UPI PIN

## Troubleshooting

### Accessibility Service Not Working

If the automation isn't functioning:
1. Go to device Settings > Accessibility
2. Find OfflineUPI in the list
3. Ensure the service is enabled
4. If enabled, toggle it off and on again
5. Restart the app

### USSD Codes Not Dialing

This can happen if:
- Your device requires manual USSD permission
- Certain manufacturers block automated USSD dialing
- Your carrier has restrictions

Solution: Check your device's phone app permissions and ensure OfflineUPI has permission to make calls.

### QR Scanner Not Opening

If the camera doesn't open:
1. Go to device Settings > Apps > OfflineUPI
2. Check if Camera permission is granted
3. Grant the permission if not already enabled
4. Restart the app

### Transaction Delays

USSD transactions typically take 5-15 seconds. If experiencing delays:
- Ensure you have stable cellular network signal
- Avoid switching apps during the transaction
- Wait for confirmation before attempting again

## Security and Privacy

OfflineUPI prioritizes your security:

- No transaction data is stored on the device
- No internet connection means no data transmission
- UPI PINs are handled directly by your bank through USSD
- The app never accesses your PIN or banking credentials
- Accessibility service only interacts with USSD system dialogs
- All transactions follow standard UPI security protocols

## Limitations

- Requires basic cellular network coverage
- Bank must support USSD-based UPI transactions
- Some device manufacturers restrict automated USSD dialing
- Transaction confirmation takes longer than internet-based UPI
- Balance inquiry and transaction history not available

## Support

For issues, questions, or feature requests, please contact through the app's feedback section or refer to the project documentation.

## License

This project is provided as-is for personal and educational use. Please comply with your local regulations regarding financial applications and UPI usage.
