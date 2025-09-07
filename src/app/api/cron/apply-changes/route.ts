
import { applyScheduledChanges } from '@/services/scheduledChangeService';
import { NextRequest, NextResponse } from 'next/server';

// This endpoint is designed to be called by an external scheduler like Google Cloud Scheduler.
// It does not contain complex time-checking logic, as that responsibility
// should lie with the scheduler service for maximum reliability.
// The scheduler should be configured to call this endpoint at the desired frequency (e.g., once per hour).
// For added robustness, you could secure this endpoint with a secret token checked in the header.

export const GET = async (req: NextRequest) => {
  try {
    console.log('Cron job triggered. Applying scheduled changes...');
    
    const result = await applyScheduledChanges();
    
    console.log(`Job finished. ${result.message}.`);
    
    return NextResponse.json({
      success: true,
      message: result.message,
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
