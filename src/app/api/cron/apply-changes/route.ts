// src/app/api/cron/apply-changes/route.ts
import { applyScheduledChangesFlow } from '@/ai/flows/apply-scheduled-changes-flow';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
  try {
    // Optional: Add security to ensure this can only be triggered by your cron service
    // For example, by checking a secret header
    // const secret = req.headers.get('X-Cron-Secret');
    // if (secret !== process.env.CRON_SECRET) {
    //   return new NextResponse('Unauthorized', { status: 401 });
    // }

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
