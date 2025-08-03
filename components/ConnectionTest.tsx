import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ApiService } from '@/utils/api';
import { useWorkoutStore } from '@/store/workout-store';
import { useNutritionStore } from '@/store/nutrition-store';

const ConnectionTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'testing' | 'connected' | 'failed'
  >('idle');
  const [programs, setPrograms] = useState<any[]>([]);

  // Get store methods
  const { testConnection, loadPrograms, setCurrentUser } = useWorkoutStore();
  const { setCurrentUser: setNutritionUser } = useNutritionStore();

  const testBackendConnection = async () => {
    setConnectionStatus('testing');

    try {
      // Test basic connection
      const isConnected = await testConnection();

      if (isConnected) {
        setConnectionStatus('connected');
        Alert.alert('✅ Success', 'Backend connection successful!');

        // Try to load programs
        await loadPrograms();

        // Set a test user ID (in a real app, this would come from authentication)
        const testUserId = 'test-user-123';
        setCurrentUser(testUserId);
        setNutritionUser(testUserId);
      } else {
        setConnectionStatus('failed');
        Alert.alert(
          '❌ Failed',
          'Could not connect to backend. Make sure the backend server is running on http://192.168.1.5:3001'
        );
      }
    } catch (error) {
      setConnectionStatus('failed');
      Alert.alert('❌ Error', `Connection test failed: ${error}`);
    }
  };

  const testProgramsAPI = async () => {
    try {
      const programsData = await ApiService.getPrograms();
      setPrograms(programsData);
      Alert.alert(
        '📋 Programs',
        `Loaded ${programsData.length} programs from backend`
      );
    } catch (error) {
      Alert.alert('❌ Programs Error', `Failed to load programs: ${error}`);
    }
  };

  const testDatabaseConnection = async () => {
    try {
      const dbResult = await ApiService.testDatabase();
      Alert.alert(
        '🗄️ Remote Database Test',
        `✅ ${dbResult.message}\n\nTimestamp: ${dbResult.data?.current_time || 'N/A'}`
      );
    } catch (error) {
      Alert.alert('❌ Remote Database Error', `Failed to connect to remote database: ${error}`);
    }
  };

  const testLocalDatabase = async () => {
    try {
      const { SyncService } = await import('@/db/sync');
      const result = await SyncService.testLocalDatabase();
      Alert.alert(
        '💾 Local Database Test',
        `${result.success ? '✅' : '❌'} ${result.message}`
      );
    } catch (error) {
      Alert.alert('❌ Local Database Error', `Failed to test local database: ${error}`);
    }
  };

  const loadInitialData = async () => {
    try {
      const { SyncService } = await import('@/db/sync');
      const result = await SyncService.initializeApp();
      Alert.alert(
        '📱 Load Initial Data',
        result.success 
          ? `✅ Data loaded!\nPrograms loaded: ${result.pulledCount}`
          : `❌ Loading failed: ${result.error}`
      );
    } catch (error) {
      Alert.alert('❌ Load Error', `Failed to load initial data: ${error}`);
    }
  };

  const forceReloadPrograms = async () => {
    try {
      const { SyncService } = await import('@/db/sync');
      const result = await SyncService.forceReloadPrograms();
      Alert.alert(
        '🔄 Force Reload Programs',
        result.success 
          ? `✅ Programs refreshed!\nReloaded: ${result.pulledCount} fresh programs`
          : `❌ Reload failed: ${result.error}`
      );
    } catch (error) {
      Alert.alert('❌ Reload Error', `Failed to reload programs: ${error}`);
    }
  };

  const syncNewContent = async () => {
    try {
      const { ContentSyncService } = await import('@/db/content-sync');
      const result = await ContentSyncService.syncNewPrograms();
      Alert.alert(
        '🆕 Sync New Content',
        result.success 
          ? (result.newPrograms > 0 
              ? `✅ Found ${result.newPrograms} new programs!` 
              : '✅ No new content available')
          : `❌ Sync failed: ${result.error}`
      );
    } catch (error) {
      Alert.alert('❌ Content Sync Error', `Failed to sync new content: ${error}`);
    }
  };

  const showAppInfo = async () => {
    try {
      const { AppUpdateManager } = await import('@/utils/app-updates');
      await AppUpdateManager.showCurrentVersionInfo();
    } catch (error) {
      Alert.alert('❌ Error', `Failed to show app info: ${error}`);
    }
  };

  const showUserData = async () => {
    try {
      const { userProfileService } = await import('@/db/services');
      const { useAuthStore } = await import('@/store/auth-store');
      
      // Get current user from auth store
      const currentUser = useAuthStore.getState().user;
      
      if (!currentUser) {
        Alert.alert('ℹ️ No User', 'No user is currently logged in');
        return;
      }
      
      // Get user profile from database
      const dbProfile = await userProfileService.getById(currentUser.email);
      
      if (dbProfile) {
        Alert.alert(
          '👤 Your Account Data',
          `📧 Email: ${dbProfile.email}\n` +
          `👤 Name: ${dbProfile.name}\n` +
          `🆔 Database ID: ${dbProfile.id}\n` +
          `📅 Created: ${dbProfile.createdAt}\n` +
          `🔄 Updated: ${dbProfile.updatedAt}`
        );
      } else {
        Alert.alert('❌ Error', 'User profile not found in database');
      }
    } catch (error) {
      Alert.alert('❌ Error', `Failed to show user data: ${error}`);
    }
  };

  const showWizardData = async () => {
    try {
      const { wizardResultsService } = await import('@/db/services');
      const { useAuthStore } = await import('@/store/auth-store');
      
      // Get current user from auth store
      const currentUser = useAuthStore.getState().user;
      
      if (!currentUser) {
        Alert.alert('ℹ️ No User', 'No user is currently logged in');
        return;
      }
      
      // Get wizard results from database
      const wizardResults = await wizardResultsService.getByUserId(currentUser.email);
      
      if (wizardResults) {
        Alert.alert(
          '🧙 Your Wizard Results',
          `🎯 Primary Goal: ${wizardResults.primaryGoal || 'Not set'}\n` +
          `💪 Fitness Level: ${wizardResults.fitnessLevel || 'Not set'}\n` +
          `📅 Workout Frequency: ${wizardResults.workoutFrequency || 'Not set'}\n` +
          `🏠 Location: ${wizardResults.workoutLocation || 'Not set'}\n` +
          `✅ Completed: ${wizardResults.completedAt || 'Not completed'}`
        );
      } else {
        Alert.alert('ℹ️ No Wizard Data', 'You haven\'t completed the wizard yet');
      }
    } catch (error) {
      Alert.alert('❌ Error', `Failed to show wizard data: ${error}`);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      case 'testing':
        return '#FF9800';
      default:
        return '#2196F3';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '✅ Connected';
      case 'failed':
        return '❌ Failed';
      case 'testing':
        return '🔄 Testing...';
      default:
        return '🔌 Not tested';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backend Connection Test</Text>

      <View
        style={[styles.statusContainer, { backgroundColor: getStatusColor() }]}
      >
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={testBackendConnection}
        disabled={connectionStatus === 'testing'}
      >
        <Text style={styles.buttonText}>Test Connection</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testLocalDatabase}>
        <Text style={styles.buttonText}>Test Local Database</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={loadInitialData}>
        <Text style={styles.buttonText}>Load Initial Data</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={forceReloadPrograms}>
        <Text style={styles.buttonText}>🔄 Force Reload Programs</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={syncNewContent}>
        <Text style={styles.buttonText}>Check for New Content</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={showAppInfo}>
        <Text style={styles.buttonText}>Show App Info</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={showUserData}>
        <Text style={styles.buttonText}>Show My Account Data</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={showWizardData}>
        <Text style={styles.buttonText}>Show My Wizard Results</Text>
      </TouchableOpacity>

      {connectionStatus === 'connected' && (
        <>
          <TouchableOpacity style={styles.button} onPress={testProgramsAPI}>
            <Text style={styles.buttonText}>Test Programs API</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={testDatabaseConnection}>
            <Text style={styles.buttonText}>Test Remote Database</Text>
          </TouchableOpacity>
        </>
      )}

      {programs.length > 0 && (
        <View style={styles.programsContainer}>
          <Text style={styles.programsTitle}>Programs from Backend:</Text>
          {programs.slice(0, 3).map((program, index) => (
            <Text key={index} style={styles.programText}>
              • {program.title || program.name}
            </Text>
          ))}
          {programs.length > 3 && (
            <Text style={styles.programText}>
              ... and {programs.length - 3} more
            </Text>
          )}
        </View>
      )}

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Instructions:</Text>
        <Text style={styles.instructionsText}>
          1. Start your backend server: npm start (in backend folder)
        </Text>
        <Text style={styles.instructionsText}>
          2. Install axios: npm install (in mobile app)
        </Text>
        <Text style={styles.instructionsText}>
          3. Click "Test Connection" above
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  programsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  programsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  programText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  instructionsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default ConnectionTest;
