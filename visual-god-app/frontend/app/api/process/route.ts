import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = 'https://visualapp-production.up.railway.app'

export async function POST(request: NextRequest) {
  try {
    const { images } = await request.json()
    
    // Call your Railway backend
    const response = await fetch(`${BACKEND_URL}/api/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images,
        userId: null
      }),
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Processing error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed'
    }, { status: 500 })
  }
}