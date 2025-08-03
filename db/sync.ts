import { ApiService } from '@/utils/api';
import { 
  programService, 
  userProfileService, 
  userProgressService,
  syncStatusService 
} from './services';
import { PROGRAMS } from '@/mocks/programs';

export interface SyncResult {
  success: boolean;
  error?: string;
  pulledCount?: number;
  pushedCount?: number;
}

export class SyncService {
  static async loadInitialData(): Promise<SyncResult> {
    try {
      console.log('🔄 Loading initial mobile app data...');
      
      // Load mock programs into local database (one-time setup)
      const existingPrograms = await programService.getAll();
      
      if (existingPrograms.length === 0) {
        console.log('📥 Loading initial programs...');
        const programsToInsert = PROGRAMS.map(program => ({
          //@ts-ignore
          title: program.title,
          //@ts-ignore
          subtitle: program.subtitle,
          description: program.description,
          duration: program.duration,
          //@ts-ignore
          difficulty: program.difficulty,
          type: program.type,
          //@ts-ignore
          image: program.image,
          data: JSON.stringify(program), // Store full program data as JSON
        }));
        
        await programService.bulkInsert(programsToInsert);
        
        console.log(`✅ Loaded ${PROGRAMS.length} programs to local database`);
        return { 
          success: true, 
          pulledCount: PROGRAMS.length,
          pushedCount: 0 
        };
      }
      
      console.log('✅ Programs already loaded');
      return { success: true, pulledCount: 0, pushedCount: 0 };
      
    } catch (error) {
      console.error('❌ Initial data loading failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async forceReloadPrograms(): Promise<SyncResult> {
    try {
      console.log('🔄 Force reloading all programs...');
      
      // Delete all existing programs
      await programService.deleteAll();
      console.log('🗑️ Cleared all existing programs');
      
      // Load fresh programs from mocks
      const programsToInsert = PROGRAMS.map(program => ({
        //@ts-ignore
        title: program.title,
        //@ts-ignore
        subtitle: program.subtitle,
        description: program.description,
        duration: program.duration,
        //@ts-ignore
        difficulty: program.difficulty,
        type: program.type,
        //@ts-ignore
        image: program.image,
        data: JSON.stringify(program), // Store full program data as JSON
      }));
      
      await programService.bulkInsert(programsToInsert);
      
      console.log(`✅ Reloaded ${PROGRAMS.length} fresh programs to local database`);
      return { 
        success: true, 
        pulledCount: PROGRAMS.length,
        pushedCount: 0 
      };
      
    } catch (error) {
      console.error('❌ Force reload failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async syncUserData(userId: string): Promise<SyncResult> {
    try {
      console.log('🔄 Starting user data sync...');
      
      // For now, this is a placeholder
      // In a real implementation, this would sync user profile and progress
      
      await syncStatusService.updateSyncStatus('user_data', {
        lastPulledAt: new Date().toISOString(),
      });
      
      console.log('✅ User data sync completed');
      return { success: true, pulledCount: 0, pushedCount: 0 };
      
    } catch (error) {
      console.error('❌ User data sync failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async initializeApp(userId?: string): Promise<SyncResult> {
    try {
      console.log('🔄 Initializing mobile app...');
      
      let totalLoaded = 0;
      
      // Load initial data (programs)
      const programsResult = await this.loadInitialData();
      if (!programsResult.success) {
        return programsResult;
      }
      totalLoaded += programsResult.pulledCount || 0;
      
      console.log(`✅ App initialization completed. Loaded: ${totalLoaded} items`);
      return { 
        success: true, 
        pulledCount: totalLoaded, 
        pushedCount: 0 
      };
      
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async testLocalDatabase(): Promise<{ success: boolean; message: string; programCount?: number }> {
    try {
      console.log('🔍 Testing local database...');
      
      const programs = await programService.getAll();
      const syncStatuses = await syncStatusService.getAllSyncStatus();
      
      console.log(`📊 Found ${programs.length} programs in local database`);
      console.log(`📊 Found ${syncStatuses.length} sync status records`);
      
      return {
        success: true,
        message: `Local database working! Found ${programs.length} programs.`,
        programCount: programs.length,
      };
      
    } catch (error) {
      console.error('❌ Local database test failed:', error);
      return {
        success: false,
        message: `Local database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}