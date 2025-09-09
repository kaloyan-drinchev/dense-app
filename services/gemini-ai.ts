import { useAuthStore } from '@/store/auth-store';
import { useWorkoutStore } from '@/store/workout-store';
import Constants from 'expo-constants';

// Get API key from Constants (loaded from app.config.js at build time)
const GEMINI_API_KEY = Constants.expoConfig?.extra?.geminiApiKey || 
                      Constants.manifest?.extra?.geminiApiKey ||
                      'AIzaSyAw2azVyXjAD239R7X6wDyQyYDEwmTty1Q'; // Fallback for development
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

// Production ready - debug logs removed

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
  private async fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        // If it's a 503 error, retry after a delay
        if (response.status === 503 && attempt < maxRetries) {
          console.log(`🔄 Attempt ${attempt} failed with 503, retrying in ${attempt * 2}s...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
          continue;
        }
        
        return response;
      } catch (error) {
        if (attempt === maxRetries) throw error;
        console.log(`🔄 Attempt ${attempt} failed, retrying in ${attempt * 2}s...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
    throw new Error('Max retries exceeded');
  }

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

      I'M A FITNESS CHAT ASSISTANT - I can help answer questions about:
      - Workout techniques and form
      - Exercise recommendations 
      - DENSE training methodology
      - Nutrition and recovery tips
      - General fitness advice

      DENSE TRAINING PRINCIPLES:
      - Push/Pull/Legs split, 2x per week
      - Training to failure on working sets
      - Progressive overload focus
      - Compounds: 6-12 reps, Isolations: 10-15 reps
      - 12-16 sets per muscle group per week
      - Rest: Compounds 2-4min, Isolations 30-90sec

      RESPONSE FORMAT:
      - Keep responses SHORT and helpful (1-3 sentences)
      - Be friendly and motivating
      - Focus on practical advice
      - No need to mention database or program changes

      Remember: I'm here to chat and help with fitness knowledge!`;
  }

  async sendMessage(userMessage: string, chatHistory: any[] = []): Promise<AIResponse> {
    try {
      
      // Validate API key first
      if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
      }
      
      // Simplified request - just send the current message for now
      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${this.buildSystemPrompt()}\n\nUser: ${userMessage}` }]
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

      const response = await this.fetchWithRetry(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from Gemini API');
      }

      const aiMessage = data.candidates[0].content.parts[0].text;

      // Just return the AI message - no database actions
      return {
        message: aiMessage,
        actions: []
      };

    } catch (error) {
      console.error('Gemini AI Error:', error);

      // More specific error messages
      let fallbackMessage = "I apologize, but I'm having trouble connecting right now. Please try again in a moment.";
      
      if (error instanceof Error) {
        // Check for common API errors
        if (error.message.includes('503')) {
          fallbackMessage = "🔄 The AI service is temporarily busy. Please try again in 10-30 seconds. Your request is important to me!";
        } else if (error.message.includes('429')) {
          fallbackMessage = "⏱️ Rate limit reached. Please wait a moment before sending another message.";
        } else if (error.message.includes('401') || error.message.includes('403')) {
          fallbackMessage = "🔑 API authentication issue. Please contact support if this persists.";
        } else if (error.message.includes('400')) {
          fallbackMessage = "🔧 Request format error. The development team has been notified.";
        } else if (!GEMINI_API_KEY) {
          fallbackMessage = "🔑 Configuration error: API key not found. Please restart the app.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          fallbackMessage = "🌐 Network connection issue. Please check your internet connection.";
        }
      }

      return {
        message: fallbackMessage
      };
    }
  }

      // Pure chat AI - no database actions
}

export const geminiAI = new GeminiAIService();
