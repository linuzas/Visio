import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://visualapp-production.up.railway.app'

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
    const { images, generate_images, image_size, sessionId } = body
    
    // Check user credits
    const { data: canProceed } = await supabase.rpc('check_user_credits', {
      user_id: user.id,
      required_credits: generate_images ? (image_size === 'youtube' ? 2 : 1) : 0
    })

    if (!canProceed) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient credits'
      }, { status: 403 })
    }
    
    // Call your Railway backend
    const response = await fetch(`${BACKEND_URL}/api/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images,
        userId: user.id,
        sessionId,
        generate_images,
        image_size
      }),
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    
    // Save generated images to database if successful
    if (data.success && data.generated_images && sessionId) {
      for (const [index, img] of data.generated_images.entries()) {
        await supabase.from('generated_images').insert({
          session_id: sessionId,
          user_id: user.id,
          filename: `generated_${index + 1}.jpg`,
          file_path: `${user.id}/${sessionId}/generated_${index + 1}.jpg`,
          prompt_text: img.prompt,
          prompt_index: index,
          platform: image_size,
          size: img.size,
          metadata: { base64: img.image_base64 }
        })
      }
    }

    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Processing error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed'
    }, { status: 500 })
  }
}