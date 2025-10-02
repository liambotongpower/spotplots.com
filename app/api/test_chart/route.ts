import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { routes } = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Chart API is working',
      routesCount: routes?.length || 0
    });
  } catch (error) {
    console.error('❌ Error in test chart API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
