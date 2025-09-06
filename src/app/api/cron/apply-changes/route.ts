
// src/app/api/cron/apply-changes/route.ts
import { applyScheduledChangesCronFlow } from '@/ai/flows/apply-scheduled-changes-flow';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
  try {
    const result = await applyScheduledChangesCronFlow();
    console.log(result.message);
    
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
