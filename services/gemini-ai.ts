import { useAuthStore } from '@/store/auth-store';
import { useWorkoutStore } from '@/store/workout-store';
import { AIActionHandlers, AIActionResult } from './ai-action-handlers';

const GEMINI_API_KEY = 'AIzaSyAw2azVyXjAD239R7X6wDyQyYDEwmTty1Q';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

export interface AIResponse {
  message: string;
  actions?: {
    type: 'modify_program' | 'generate_program' | 'update_settings';
    payload: any;
    description: string;
    executed?: boolean;
    result?: AIActionResult;
  }[];
}

class GeminiAIService {
  private getUserContext() {
    const { user } = useAuthStore.getState();
    const { generatedProgram, userProgress } = useWorkoutStore.getState();
    
    return {
      userEmail: user?.email,
      currentProgram: generatedProgram?.programName || 'No active program',
      currentWeek: userProgress?.currentWeek || 1,
      currentWorkout: userProgress?.currentWorkout || 1,
      // Add more context as needed
    };
  }

  private buildSystemPrompt() {
    const context = this.getUserContext();
    
    return `You are an expert AI fitness assistant for the DENSE training app. 

CONTEXT:
- User: ${context.userEmail}
- Current Program: ${context.currentProgram}
- Week: ${context.currentWeek}, Workout: ${context.currentWorkout}

CAPABILITIES:
1. Answer fitness questions
2. Modify workout programs (change exercises, sets, reps, focus muscle groups)
3. Generate new DENSE programs based on user goals
4. Provide nutrition and recovery advice

DENSE TRAINING PRINCIPLES:
- Push/Pull/Legs split, 2x per week
- Training to failure on working sets
- Progressive overload focus
- Compounds: 6-12 reps, Isolations: 10-15 reps
- 12-16 sets per muscle group per week
- Rest: Compounds 2-4min, Isolations 30-90sec

RESPONSE FORMAT:
- Keep responses conversational and helpful
- If user wants program changes, ask clarifying questions first
- Be specific about exercise recommendations
- Always prioritize safety and proper form

Remember: You're helping someone achieve their fitness goals through the DENSE methodology.`;
  }

  async sendMessage(userMessage: string, chatHistory: any[] = []): Promise<AIResponse> {
    try {
      // Build conversation history for context
      const conversationHistory = chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: this.buildSystemPrompt() }]
          },
          ...conversationHistory,
          {
            role: 'user',
            parts: [{ text: userMessage }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from Gemini API');
      }

      const aiMessage = data.candidates[0].content.parts[0].text;

      // Parse for potential actions and execute them
      const actions = await this.parseAndExecuteActions(aiMessage, userMessage);

      return {
        message: aiMessage,
        actions: actions
      };

    } catch (error) {
      console.error('Gemini AI Error:', error);
      
      // Fallback response
      return {
        message: "I apologize, but I'm having trouble connecting right now. Please try again in a moment. In the meantime, I'm here to help with your fitness questions!"
      };
    }
  }

  private async parseAndExecuteActions(aiMessage: string, userMessage: string): Promise<any[]> {
    const actions: any[] = [];
    const userInput = userMessage.toLowerCase();
    
    // Enhanced action detection with automatic execution
    
    // 1. MODIFY PROGRAM
    if (this.isModifyProgramRequest(userInput)) {
      const modifications = this.extractModifications(userMessage, aiMessage);
      
      const action = {
        type: 'modify_program' as const,
        payload: modifications,
        description: 'Modify current workout program',
        executed: false,
        result: undefined
      };

      // Execute the action
      try {
        const result = await AIActionHandlers.modifyProgram(modifications);
        action.executed = true;
        action.result = result;
        console.log('🔄 Program modification executed:', result);
      } catch (error) {
        console.error('❌ Failed to execute program modification:', error);
        action.result = { success: false, message: 'Failed to modify program' };
      }
      
      actions.push(action);
    }

    // 2. GENERATE NEW PROGRAM  
    if (this.isGenerateNewProgramRequest(userInput)) {
      const parameters = this.extractGenerationParameters(userMessage, aiMessage);
      
      const action = {
        type: 'generate_program' as const,
        payload: parameters,
        description: 'Generate new workout program',
        executed: false,
        result: undefined
      };

      // Execute the action
      try {
        const result = await AIActionHandlers.generateNewProgram(parameters);
        action.executed = true;
        action.result = result;
        console.log('🚀 New program generation executed:', result);
      } catch (error) {
        console.error('❌ Failed to execute program generation:', error);
        action.result = { success: false, message: 'Failed to generate new program' };
      }
      
      actions.push(action);
    }

    // 3. UPDATE SETTINGS
    if (this.isUpdateSettingsRequest(userInput)) {
      const settings = this.extractSettingsChanges(userMessage, aiMessage);
      
      const action = {
        type: 'update_settings' as const,
        payload: settings,
        description: 'Update user preferences',
        executed: false,
        result: undefined
      };

      // Execute the action
      try {
        const result = await AIActionHandlers.updateSettings(settings);
        action.executed = true;
        action.result = result;
        console.log('⚙️ Settings update executed:', result);
      } catch (error) {
        console.error('❌ Failed to execute settings update:', error);
        action.result = { success: false, message: 'Failed to update settings' };
      }
      
      actions.push(action);
    }

    return actions;
  }

  private isModifyProgramRequest(userInput: string): boolean {
    const modifyKeywords = ['modify', 'change', 'adjust', 'update', 'replace', 'switch'];
    const programKeywords = ['program', 'workout', 'routine', 'exercises', 'training'];
    
    return modifyKeywords.some(k => userInput.includes(k)) && 
           programKeywords.some(k => userInput.includes(k));
  }

  private isGenerateNewProgramRequest(userInput: string): boolean {
    const generateKeywords = ['new', 'generate', 'create', 'make', 'build', 'design'];
    const programKeywords = ['program', 'workout', 'routine', 'plan', 'training'];
    
    return generateKeywords.some(k => userInput.includes(k)) && 
           programKeywords.some(k => userInput.includes(k));
  }

  private isUpdateSettingsRequest(userInput: string): boolean {
    const settingsKeywords = ['preferences', 'settings', 'goals', 'experience', 'days', 'level'];
    const updateKeywords = ['update', 'change', 'set', 'modify'];
    
    return settingsKeywords.some(k => userInput.includes(k)) || 
           (updateKeywords.some(k => userInput.includes(k)) && settingsKeywords.some(k => userInput.includes(k)));
  }

  private extractModifications(userMessage: string, aiMessage: string) {
    const userInput = userMessage.toLowerCase();
    const modifications: any = {
      additionalNotes: `Modified based on: "${userMessage}"`
    };

    // Extract focus muscle groups
    const muscleGroups = ['chest', 'shoulders', 'arms', 'back', 'legs', 'glutes', 'core', 'triceps', 'biceps', 'quads', 'hamstrings'];
    const mentionedMuscles = muscleGroups.filter(muscle => userInput.includes(muscle));
    if (mentionedMuscles.length > 0) {
      modifications.focusMuscleGroups = mentionedMuscles;
    }

    // Extract intensity changes
    if (userInput.includes('harder') || userInput.includes('intense') || userInput.includes('increase')) {
      modifications.intensityAdjustment = 'increase';
    } else if (userInput.includes('easier') || userInput.includes('lighter') || userInput.includes('decrease')) {
      modifications.intensityAdjustment = 'decrease';
    }

    return modifications;
  }

  private extractGenerationParameters(userMessage: string, aiMessage: string) {
    const userInput = userMessage.toLowerCase();
    const parameters: any = {
      additionalRequests: userMessage
    };

    // Extract goals
    if (userInput.includes('muscle') || userInput.includes('gain') || userInput.includes('mass')) {
      parameters.goal = 'muscle_gain';
    } else if (userInput.includes('strength') || userInput.includes('strong')) {
      parameters.goal = 'strength';
    } else if (userInput.includes('endurance') || userInput.includes('cardio')) {
      parameters.goal = 'endurance';
    } else if (userInput.includes('fat') || userInput.includes('weight loss') || userInput.includes('cut')) {
      parameters.goal = 'fat_loss';
    }

    // Extract experience level
    if (userInput.includes('beginner') || userInput.includes('new')) {
      parameters.experience = 'beginner';
    } else if (userInput.includes('advanced') || userInput.includes('expert')) {
      parameters.experience = 'advanced';
    }

    // Extract days per week
    const dayMatches = userInput.match(/(\d+)\s*days?/);
    if (dayMatches) {
      parameters.daysPerWeek = parseInt(dayMatches[1]);
    }

    // Extract focus muscle groups
    const muscleGroups = ['chest', 'shoulders', 'arms', 'back', 'legs', 'glutes', 'core'];
    const mentionedMuscles = muscleGroups.filter(muscle => userInput.includes(muscle));
    if (mentionedMuscles.length > 0) {
      parameters.focusMuscleGroups = mentionedMuscles;
    }

    return parameters;
  }

  private extractSettingsChanges(userMessage: string, aiMessage: string) {
    const userInput = userMessage.toLowerCase();
    const settings: any = {};

    // Extract and set relevant settings based on user input
    if (userInput.includes('goal')) {
      if (userInput.includes('muscle')) settings.fitnessGoals = 'muscle_gain';
      else if (userInput.includes('strength')) settings.fitnessGoals = 'strength';
      else if (userInput.includes('endurance')) settings.fitnessGoals = 'endurance';
      else if (userInput.includes('fat loss')) settings.fitnessGoals = 'fat_loss';
    }

    if (userInput.includes('experience') || userInput.includes('level')) {
      if (userInput.includes('beginner')) settings.experienceLevel = 'beginner';
      else if (userInput.includes('intermediate')) settings.experienceLevel = 'intermediate';
      else if (userInput.includes('advanced')) settings.experienceLevel = 'advanced';
    }

    const dayMatches = userInput.match(/(\d+)\s*days?/);
    if (dayMatches) {
      settings.availableDays = parseInt(dayMatches[1]);
    }

    return settings;
  }
}

export const geminiAI = new GeminiAIService();
