
// src/app/api/cron/apply-changes/route.ts
import { applyScheduledChanges } from '@/services/scheduledChangeService';
import { getSettings, updateSettings } from '@/services/settingsService';
import { NextRequest, NextResponse } from 'next/server';
import { isSameDay, parseISO } from 'date-fns';

export const GET = async (req: NextRequest) => {
  try {
    const settings = await getSettings();
    const timeZone = 'America/Costa_Rica'; 
    
    // Get current date and time in Costa Rica
    const now = new Date();
    const currentHourCR = parseInt(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone }).format(now));
    const currentMinuteCR = parseInt(new Intl.DateTimeFormat('en-US', { minute: 'numeric', timeZone }).format(now));
    
    // Check if the job has already run successfully today
    const lastRunDate = settings.lastSuccessfulRun ? parseISO(settings.lastSuccessfulRun) : null;
    const hasRunToday = lastRunDate ? isSameDay(lastRunDate, now) : false;

    console.log(`Cron running. Current CR Time: ${currentHourCR}:${currentMinuteCR}. Scheduled: ${settings.cronHour}:${settings.cronMinute}. Has run today: ${hasRunToday}`);
    
    // Conditions to run the job:
    // 1. The current time matches the scheduled time.
    // 2. The job has NOT already run successfully today.
    if (currentHourCR === settings.cronHour && currentMinuteCR === settings.cronMinute && !hasRunToday) {
      console.log('Time matches and job has not run today. Applying scheduled changes...');
      
      const result = await applyScheduledChanges();
      
      // CRITICAL: Immediately update the last successful run timestamp to prevent re-runs
      await updateSettings({ lastSuccessfulRun: new Date().toISOString() });
      
      console.log(`Job finished. ${result.message}. lastSuccessfulRun updated.`);
      
      return NextResponse.json({
        success: true,
        message: result.message,
        appliedChangesCount: result.appliedChangesCount,
      });
    }

    let message = 'Job skipped.';
    if (hasRunToday) {
        message = 'Job skipped: Already ran successfully today.';
    } else if (currentHourCR !== settings.cronHour || currentMinuteCR !== settings.cronMinute) {
        message = `Job skipped: Current time ${currentHourCR}:${currentMinuteCR} does not match scheduled time ${settings.cronHour}:${settings.cronMinute}.`;
    }
    
    console.log(message);
    return NextResponse.json({ success: true, message, appliedChangesCount: 0 });

  } catch (error) {
    console.error('Error running scheduled changes cron job:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
