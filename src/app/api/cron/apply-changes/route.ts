// src/app/api/cron/apply-changes/route.ts
import { applyScheduledChangesFlow } from '@/ai/flows/apply-scheduled-changes-flow';
import { getSettings } from '@/services/settingsService';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
  try {
    const settings = await getSettings();
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    
    // Check if the current time matches the configured time
    if (currentHour !== settings.cronHour || currentMinute !== settings.cronMinute) {
      console.log(`Cron job skipped. Current time ${currentHour}:${currentMinute} does not match scheduled time ${settings.cronHour}:${settings.cronMinute}.`);
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
