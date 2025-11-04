# iOS Live Activities Setup Guide

## ⚠️ Requirements

- iOS 16.1+ (Live Activities API)
- **Custom Development Build** (NOT Expo Go)
- Xcode 14+
- Apple Developer Account

## 📋 Overview

Live Activities show a **live workout timer** on the iPhone lock screen and Dynamic Island. The timer updates in real-time even when the phone is locked.

## 🔧 Setup Steps

### Step 1: Create Custom Development Build

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Create a development build profile
eas build:configure

# Build for iOS (simulator or device)
eas build --profile development --platform ios
```

### Step 2: Add Native Module Bridge

Create `ios/LiveActivityModule.swift`:

```swift
import ActivityKit
import Foundation

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {
  
  var currentActivity: Activity<WorkoutActivityAttributes>?
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc
  func startActivity(_ options: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let attributes = options["attributes"] as? [String: Any],
          let workoutName = attributes["workoutName"] as? String,
          let startTime = attributes["startTime"] as? Double else {
      reject("INVALID_PARAMS", "Invalid parameters", nil)
      return
    }
    
    guard let contentState = options["contentState"] as? [String: Any],
          let elapsedSeconds = contentState["elapsedSeconds"] as? Int,
          let isPaused = contentState["isPaused"] as? Bool else {
      reject("INVALID_STATE", "Invalid content state", nil)
      return
    }
    
    let activityAttributes = WorkoutActivityAttributes(
      workoutName: workoutName,
      startTime: Date(timeIntervalSince1970: startTime / 1000)
    )
    
    let initialState = WorkoutActivityAttributes.ContentState(
      elapsedSeconds: elapsedSeconds,
      isPaused: isPaused
    )
    
    do {
      let activity = try Activity.request(
        attributes: activityAttributes,
        content: .init(state: initialState, staleDate: nil),
        pushType: nil
      )
      
      self.currentActivity = activity
      resolve(activity.id)
    } catch {
      reject("START_FAILED", "Failed to start activity: \(error.localizedDescription)", error)
    }
  }
  
  @objc
  func updateActivity(_ options: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let activity = currentActivity else {
      reject("NO_ACTIVITY", "No active activity", nil)
      return
    }
    
    guard let contentState = options["contentState"] as? [String: Any],
          let elapsedSeconds = contentState["elapsedSeconds"] as? Int,
          let isPaused = contentState["isPaused"] as? Bool else {
      reject("INVALID_STATE", "Invalid content state", nil)
      return
    }
    
    let newState = WorkoutActivityAttributes.ContentState(
      elapsedSeconds: elapsedSeconds,
      isPaused: isPaused
    )
    
    Task {
      await activity.update(using: newState)
      resolve(nil)
    }
  }
  
  @objc
  func endActivity(_ options: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let activity = currentActivity else {
      reject("NO_ACTIVITY", "No active activity", nil)
      return
    }
    
    guard let contentState = options["contentState"] as? [String: Any],
          let elapsedSeconds = contentState["elapsedSeconds"] as? Int,
          let isPaused = contentState["isPaused"] as? Bool else {
      reject("INVALID_STATE", "Invalid content state", nil)
      return
    }
    
    let finalState = WorkoutActivityAttributes.ContentState(
      elapsedSeconds: elapsedSeconds,
      isPaused: isPaused
    )
    
    Task {
      await activity.end(using: finalState, dismissalPolicy: .default)
      self.currentActivity = nil
      resolve(nil)
    }
  }
}
```

### Step 3: Create Bridge Header

Create `ios/LiveActivityModule.m`:

```objc
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LiveActivityModule, NSObject)

RCT_EXTERN_METHOD(startActivity:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateActivity:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(endActivity:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
```

### Step 4: Create Activity Attributes

Create `ios/WorkoutActivityAttributes.swift`:

```swift
import ActivityKit
import Foundation

struct WorkoutActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var elapsedSeconds: Int
    var isPaused: Bool
  }
  
  var workoutName: String
  var startTime: Date
}
```

### Step 5: Create Widget Extension

In Xcode:
1. File > New > Target > Widget Extension
2. Name it "WorkoutWidget"
3. Uncheck "Include Configuration Intent"

Create `WorkoutWidget/WorkoutWidgetLiveActivity.swift`:

```swift
import ActivityKit
import WidgetKit
import SwiftUI

struct WorkoutWidgetLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: WorkoutActivityAttributes.self) { context in
      // Lock screen UI - Minimal design: Timer left, Pause/Play right
      HStack(alignment: .center, spacing: 16) {
        // Left side: Live Timer (BIG and prominent)
        Text(formatTime(context.state.elapsedSeconds))
          .font(.system(size: 48, weight: .bold, design: .monospaced))
          .foregroundColor(Color(red: 0, green: 1, blue: 0.53)) // #00FF87
        
        Spacer()
        
        // Right side: Pause/Play indicator
        VStack(spacing: 4) {
          Text(context.state.isPaused ? "⏸️" : "▶️")
            .font(.system(size: 40))
          
          Text(context.state.isPaused ? "Paused" : "Running")
            .font(.caption2)
            .foregroundColor(.white.opacity(0.7))
        }
      }
      .padding(.horizontal, 20)
      .padding(.vertical, 16)
      .background(Color.black.opacity(0.95))
      
    } dynamicIsland: { context in
      // Dynamic Island UI - Timer on left, status on right
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          // Timer
          Text(formatTime(context.state.elapsedSeconds))
            .font(.system(.title2, design: .monospaced))
            .bold()
            .foregroundColor(Color(red: 0, green: 1, blue: 0.53))
        }
        
        DynamicIslandExpandedRegion(.trailing) {
          // Pause/Play
          Text(context.state.isPaused ? "⏸️" : "▶️")
            .font(.title2)
        }
        
        DynamicIslandExpandedRegion(.bottom) {
          Text(context.attributes.workoutName)
            .font(.caption)
            .foregroundColor(.white.opacity(0.7))
        }
      } compactLeading: {
        // Compact: Just timer
        Text(formatTime(context.state.elapsedSeconds))
          .font(.system(.caption2, design: .monospaced))
          .bold()
          .foregroundColor(Color(red: 0, green: 1, blue: 0.53))
      } compactTrailing: {
        // Compact: Just play/pause
        Text(context.state.isPaused ? "⏸️" : "▶️")
          .font(.caption)
      } minimal: {
        // Minimal: Just indicator
        Text(context.state.isPaused ? "⏸️" : "▶️")
          .font(.caption2)
      }
    }
  }
  
  func formatTime(_ seconds: Int) -> String {
    let hours = seconds / 3600
    let minutes = (seconds % 3600) / 60
    let secs = seconds % 60
    
    if hours > 0 {
      return String(format: "%d:%02d:%02d", hours, minutes, secs)
    }
    return String(format: "%d:%02d", minutes, secs)
  }
}
```

### Step 6: Update Info.plist

Add to your `ios/YourApp/Info.plist`:

```xml
<key>NSSupportsLiveActivities</key>
<true/>
```

### Step 7: Rebuild

```bash
# Rebuild the app with native changes
eas build --profile development --platform ios

# Or if running locally with Xcode:
# Open ios/YourApp.xcworkspace in Xcode and build
```

## 🎉 Result

Once set up, you'll have:

- **Lock Screen**: Large live timer showing workout progress
- **Dynamic Island** (iPhone 14 Pro+): Compact live timer in the notch
- **Always-On Display**: Timer visible even with screen off (iPhone 14 Pro+)

## 🐛 Troubleshooting

### "Module not found"
- Make sure you're using a development build, not Expo Go
- Rebuild the app after adding native files

### Widget not showing
- Check Info.plist has `NSSupportsLiveActivities`
- Restart device
- Check iOS version (16.1+ required)

### Timer not updating
- Make sure `updateActivity` is being called every second
- Check console for errors

## 📚 Resources

- [Apple ActivityKit Documentation](https://developer.apple.com/documentation/activitykit)
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)

