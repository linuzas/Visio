import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = 'https://visualapp-production.up.railway.app'

export async function POST(request: NextRequest) {
  try {
    const { images, generate_images } = await request.json()
    
    console.log('Calling backend:', BACKEND_URL) // Add this for debugging
    
    // Call your Railway backend
    const response = await fetch(`${BACKEND_URL}/api/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images,
        userId: null,
        generate_images: generate_images || true
      }),
    })

    console.log('Backend response status:', response.status) // Add this for debugging

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