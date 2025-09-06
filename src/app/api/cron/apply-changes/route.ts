
// src/app/api/cron/apply-changes/route.ts
import { applyScheduledChangesFlow } from '@/ai/flows/apply-scheduled-changes-flow';
import { getSettings } from '@/services/settingsService';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
  try {
    const settings = await getSettings();
    
    // Get current time in UTC
    const nowUtc = new Date();

    // Convert UTC to Costa Rica time (UTC-6)
    // Subtract 6 hours (6 * 60 * 60 * 1000 milliseconds)
    const costaRicaTime = new Date(nowUtc.getTime() - (6 * 60 * 60 * 1000));

    const currentHourCR = costaRicaTime.getUTCHours(); // Use getUTCHours on the adjusted date
    const currentMinuteCR = costaRicaTime.getUTCMinutes(); // Use getUTCMinutes on the adjusted date
    
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
