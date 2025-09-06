
// src/app/api/cron/apply-changes/route.ts
import { applyScheduledChangesFlow } from '@/ai/flows/apply-scheduled-changes-flow';
import { getSettings } from '@/services/settingsService';
import { NextRequest, NextResponse } from 'next/server';
import { utcToZonedTime, format } from 'date-fns-tz';

export const GET = async (req: NextRequest) => {
  try {
    const settings = await getSettings();
    const timeZone = 'America/Costa_Rica';

    // Get current time in UTC and convert it to Costa Rica's timezone
    const nowUtc = new Date();
    const zonedDate = utcToZonedTime(nowUtc, timeZone);

    // Extract hour and minute from the zoned date
    const currentHourCR = parseInt(format(zonedDate, 'H', { timeZone }));
    const currentMinuteCR = parseInt(format(zonedDate, 'm', { timeZone }));
    
    console.log(`Cron trigger received. Current Costa Rica time: ${currentHourCR}:${currentMinuteCR}. Scheduled time: ${settings.cronHour}:${settings.cronMinute}.`);
    
    // Check if the current Costa Rica time matches the configured time
    if (currentHourCR !== settings.cronHour || currentMinuteCR !== settings.cronMinute) {
      return NextResponse.json({
        success: true,
        message: 'Job skipped, not the scheduled time.',
      });
    }

    console.log('Cron job started: Applying scheduled changes...');
    const result = await applyScheduledChangesFlow();
    console.log(`Cron job finished: ${result.appliedChangesCount} changes applied.`);
    
    return NextResponse.json({
      success: true,
      appliedChangesCount: result.appliedChangesCount,
    });
  } catch (error) {
    console.error('Error running scheduled changes cron job:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
