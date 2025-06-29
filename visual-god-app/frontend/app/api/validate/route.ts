// File: visual-god-app/frontend/app/api/validate/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://visio-production-ec6a.up.railway.app'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { images } = body
    
    if (!images || images.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No images provided'
      }, { status: 400 })
    }
    
    // Call your Railway backend validation endpoint
    const response = await fetch(`${BACKEND_URL}/api/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images,
        userId: user.id
      }),
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    }, { status: 500 })
  }
}