export default {
  expo: {
    name: 'DENSE',
    slug: 'dense',
    version: '1.0.1',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'dense',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true, // Keep this
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      buildNumber: '2',
      bundleIdentifier: 'app.dense',
      infoPlist: {
        NSCameraUsageDescription:
          'This app uses the camera to scan food barcodes for nutrition tracking.',
        NSMicrophoneUsageDescription:
          'This app uses the microphone for video recording.',
      },
      config: {
        usesICloudStorage: false,
        usesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'app.dense',
      permissions: ['CAMERA', 'RECORD_AUDIO'],
    },
    web: {
      favicon: './assets/images/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      [
        'expo-router',
        {
          origin: 'https://dense.app/',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission:
            'Allow app to access camera for scanning food barcodes.',
          microphonePermission:
            'Allow app to access microphone for video recording.',
        },
      ],
      // UPDATED: Explicitly enable New Architecture here
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '15.1',
            newArchEnabled: true,
          },
          android: {
            newArchEnabled: true,
          },
        },
      ],
      'expo-font',
      'expo-sqlite',
      'expo-web-browser',
    ],
    experiments: {
      typedRoutes: true,
    },
    assetBundlePatterns: ['assets/fonts/*', 'assets/images/*'],
    extra: {
      geminiApiKey: process.env.GEMINI_API_KEY,
      supabaseUrl:
        process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
      supabaseAnonKey:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY,
      eas: {
        projectId: '7b79d091-3f30-4d65-84d4-3e261cabcd84',
      },
    },
    privacy: 'public',
    privacyPolicyUrl: 'https://lazarovtwins.com/dense/privacy-policy',
  },
};
