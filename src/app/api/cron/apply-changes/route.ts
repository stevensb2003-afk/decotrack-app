
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
      new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone }).format(now)
    );
    const currentMinuteCR = parseInt(
      new Intl.DateTimeFormat('en-US', { minute: 'numeric', timeZone }).format(now)
    );
    
    console.log(`Cron job running. Current Costa Rica time: ${currentHourCR}:${currentMinuteCR}. Scheduled to run at: ${settings.cronHour}:${settings.cronMinute}.`);

    if (currentHourCR === settings.cronHour && currentMinuteCR === settings.cronMinute) {
      console.log('Time matches. Applying scheduled changes...');
      const result = await applyScheduledChangesFlow();
      console.log(result.message);
      
      return NextResponse.json({
        success: true,
        message: result.message,
        appliedChangesCount: result.appliedChangesCount,
      });
    }

    const message = `Job skipped. Current time ${currentHourCR}:${currentMinuteCR} does not match scheduled time ${settings.cronHour}:${settings.cronMinute}.`;
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
