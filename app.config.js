export default {
  expo: {
    name: "DENSE",
    slug: "dense",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "dense",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "app.dense",
      infoPlist: {
        NSCameraUsageDescription: "This app uses the camera to scan food barcodes for nutrition tracking."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "app.dense",
      permissions: ["CAMERA"]
    },
    web: {
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      [
        "expo-router",
        {
          origin: "https://rork.app/"
        }
      ],
      [
        "expo-barcode-scanner",
        {
          cameraPermission: "Allow app to access camera for scanning food barcodes."
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    assetBundlePatterns: [
      "assets/fonts/*",
      "assets/images/*"
    ],
    extra: {
      geminiApiKey: process.env.GEMINI_API_KEY
    }
  }
};
