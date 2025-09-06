// src/app/api/cron/apply-changes/route.ts
import { applyScheduledChangesFlow } from '@/ai/flows/apply-scheduled-changes-flow';
import { getSettings } from '@/services/settingsService';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
  try {
    const settings = await getSettings();
    const timeZone = 'America/Costa_Rica';

    const now = new Date();

    const currentHourCR = parseInt(
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone,
      }).format(now)
    );
    
    const currentMinuteCR = parseInt(
      new Intl.DateTimeFormat('en-US', {
        minute: 'numeric',
        timeZone,
      }).format(now)
    );
    
    console.log(`Cron trigger received. Current Costa Rica time: ${currentHourCR}:${currentMinuteCR}. Scheduled time: ${settings.cronHour}:${settings.cronMinute}.`);
    
    // Check if the current Costa Rica time matches the configured time
    if (currentHourCR === settings.cronHour && currentMinuteCR === settings.cronMinute) {
      console.log('Cron job started: Applying scheduled changes...');
      const result = await applyScheduledChangesFlow();
      console.log(`Cron job finished: ${result.appliedChangesCount} changes applied.`);
      
      return NextResponse.json({
        success: true,
        appliedChangesCount: result.appliedChangesCount,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Job skipped. Current time ${currentHourCR}:${currentMinuteCR} does not match scheduled time ${settings.cronHour}:${settings.cronMinute}.`,
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
