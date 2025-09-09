// Legal URLs and content for App Store compliance

export const LEGAL_URLS = {
  privacyPolicy: 'https://lazarovtwins.com/dense/privacy-policy',
  termsOfService: 'https://lazarovtwins.com/dense/terms-of-service',
  support: 'mailto:support@lazarovtwins.com',
  website: 'https://lazarovtwins.com'
};

export const LEGAL_CONTENT = {
  privacyPolicyTitle: 'Privacy Policy',
  termsOfServiceTitle: 'Terms of Service',
  supportTitle: 'Support & Help',
  
  // Required subscription disclosures for Apple
  subscriptionDisclosure: {
    trialTerms: 'Free trial allows you to explore all premium features. No payment required during the trial period. You can cancel anytime before the trial ends.',
    subscriptionTerms: 'Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period. Account will be charged for renewal within 24 hours prior to the end of the current period.',
    cancellationTerms: 'You can manage and cancel your subscription by going to your Account Settings in the App Store after purchase.',
    priceTerms: 'Prices are in US dollars and may vary in other countries. Prices are subject to change without notice.',
  },
  
  // App description for App Store
  appDescription: 'DENSE is an AI-powered fitness app that creates personalized workout programs tailored to your goals, experience level, and preferences. Get professional-grade training programs designed by Mr. Olympia competitors.',
  
  // What data we collect (for privacy policy)
  dataCollection: {
    required: [
      'Account information (email, profile data)',
      'Workout progress and statistics', 
      'App usage analytics',
      'Device information for app functionality'
    ],
    optional: [
      'Camera access for food barcode scanning',
      'Photos for progress tracking',
      'Location for gym recommendations (if enabled)'
    ]
  }
};

// Helper function to open URLs
export const openLegalURL = async (type) => {
  const { Linking } = await import('react-native');
  try {
    const url = LEGAL_URLS[type];
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.error(`Cannot open URL: ${url}`);
    }
  } catch (error) {
    console.error('Error opening legal URL:', error);
  }
};
