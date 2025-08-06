import { ApiService } from '@/utils/api';
import { programService, syncStatusService } from './services';
import { PROGRAMS } from '@/mocks/programs';
import { Program as WorkoutProgram } from '@/types/workout';
import { Program as DbProgram, NewProgram } from './schema';

// Get API base URL from the same config as ApiService
const getApiBaseUrl = () => {
  return __DEV__ 
    ? 'http://192.168.1.5:3001'
    : 'https://your-production-backend.com';
};

export interface ContentSyncResult {
  success: boolean;
  newPrograms: number;
  error?: string;
}

export class ContentSyncService {
  
  /**
   * Fetch new programs from server (content-only sync)
   * This doesn't sync user data - only new content from admin
   */
  static async syncNewPrograms(): Promise<ContentSyncResult> {
    try {
      console.log('🔄 Checking for new programs...');
      
      // Try to fetch programs from content server
      let serverPrograms: WorkoutProgram[] = [];
      try {
        // Use content-specific endpoint for new programs
        const response = await fetch(`${getApiBaseUrl()}/api/content/programs`);
        if (response.ok) {
          serverPrograms = await response.json();
          console.log(`📥 Found ${serverPrograms.length} programs on server`);
        } else {
          throw new Error('Content server unavailable');
        }
      } catch (error) {
        console.log('⚠️ Content server unavailable, using local programs only');
        serverPrograms = PROGRAMS; // Fallback to local
      }
      
      // Get existing programs from local database
      const localPrograms = await programService.getAll();
      const existingIds = new Set(localPrograms.map(p => p.id));
      
      // Find new programs (not in local database)
      const newPrograms: WorkoutProgram[] = serverPrograms.filter(program => 
        !existingIds.has(program.id)
      );
      
      if (newPrograms.length > 0) {
        console.log(`🆕 Found ${newPrograms.length} new programs to add`);
        
        // Add new programs to local database
        const programsToInsert: NewProgram[] = newPrograms.map(program => ({
          id: program.id,
          title: program.name, // WorkoutProgram.name -> DbProgram.title
          subtitle: `${program.duration} weeks • ${program.focusArea}`, // Generate subtitle
          description: program.description,
          duration: program.duration,
          difficulty: 'intermediate', // Default difficulty since WorkoutProgram doesn't have this
          type: program.type,
          image: program.imageUrl, // WorkoutProgram.imageUrl -> DbProgram.image
          data: JSON.stringify(program), // Store full workout program as JSON
        }));
        
        await programService.bulkInsert(programsToInsert);
        
        // Update sync timestamp
        await syncStatusService.updateSyncStatus('content_sync', {
          lastPulledAt: new Date().toISOString(),
        });
        
        console.log(`✅ Added ${newPrograms.length} new programs to local database`);
        
        return {
          success: true,
          newPrograms: newPrograms.length,
        };
      } else {
        console.log('✅ No new programs available');
        return {
          success: true,
          newPrograms: 0,
        };
      }
      
    } catch (error) {
      console.error('❌ Content sync failed:', error);
      return {
        success: false,
        newPrograms: 0,
        error: error instanceof Error ? error.message : 'Content sync failed',
      };
    }
  }

  /**
   * Check for new content periodically
   */
  static async checkForNewContent(): Promise<boolean> {
    try {
      const lastSync = await syncStatusService.getSyncStatus('content_sync');
      const now = new Date();
      const lastSyncTime = lastSync?.lastPulledAt ? new Date(lastSync.lastPulledAt) : new Date(0);
      
      // Check if it's been more than 24 hours since last sync
      const hoursSinceLastSync = (now.getTime() - lastSyncTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastSync >= 24) {
        console.log('🔄 Auto-checking for new content...');
        const result = await this.syncNewPrograms();
        return result.newPrograms > 0;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Auto content check failed:', error);
      return false;
    }
  }

  /**
   * Get content sync status for UI
   */
  static async getContentSyncStatus() {
    try {
      const syncStatus = await syncStatusService.getSyncStatus('content_sync');
      const localPrograms = await programService.getAll();
      
      return {
        lastSyncTime: syncStatus?.lastPulledAt,
        totalPrograms: localPrograms.length,
        hasContent: localPrograms.length > 0,
      };
    } catch (error) {
      console.error('❌ Failed to get content sync status:', error);
      return {
        lastSyncTime: null,
        totalPrograms: 0,
        hasContent: false,
      };
    }
  }
}