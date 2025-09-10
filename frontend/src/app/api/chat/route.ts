import { NextRequest, NextResponse } from 'next/server';

// This is a fallback route for backward compatibility
// The frontend should use the session-based API service instead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { 
          message: {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Error: Message is required',
            timestamp: new Date(),
          },
          success: false,
          error: 'Message is required'
        },
        { status: 400 }
      );
    }

    // Return a helpful error message directing users to use the session-based API
    return NextResponse.json({
      message: {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'This endpoint is deprecated. Please use the session-based API. The frontend should create a session first using /session/create, then send messages to /chat/{session_id}.',
        timestamp: new Date(),
      },
      success: false,
      error: 'Deprecated endpoint - use session-based API'
    });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { 
        message: {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
