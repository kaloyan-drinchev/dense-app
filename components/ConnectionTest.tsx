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
          'Could not connect to backend. Make sure the backend server is running on http://localhost:3001'
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

      {connectionStatus === 'connected' && (
        <TouchableOpacity style={styles.button} onPress={testProgramsAPI}>
          <Text style={styles.buttonText}>Test Programs API</Text>
        </TouchableOpacity>
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
