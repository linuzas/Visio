// File: visual-god-app/frontend/app/api/validate/route.ts
// FIXED VERSION - Better error handling and timeout management

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
        error: 'No images provided',
        validation_results: [],
        valid_products: [],
        rejected_images: [],
        can_proceed: false
      }, { status: 400 })
    }

    console.log(`🔍 Validating ${images.length} images for user ${user.id}`)
    
    // Call Railway backend validation endpoint with timeout
    let response: Response
    
    try {
      response = await fetch(`${BACKEND_URL}/api/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images,
          userId: user.id
        }),
        // Set shorter timeout for validation (30 seconds)
        signal: AbortSignal.timeout(30000)
      })
    } catch (fetchError: any) {
      console.error('Backend validation fetch error:', fetchError)
      
      if (fetchError.name === 'AbortError' || fetchError.message.includes('timeout')) {
        return NextResponse.json({
          success: false,
          error: 'Validation timed out. Please try with fewer images.',
          validation_results: [],
          valid_products: [],
          rejected_images: [],
          can_proceed: false
        }, { status: 408 })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Unable to connect to validation service. Please try again.',
        validation_results: [],
        valid_products: [],
        rejected_images: [],
        can_proceed: false
      }, { status: 503 })
    }

    if (!response.ok) {
      console.error(`Backend validation error: ${response.status}`)
      
      let errorMessage = 'Validation failed'
      if (response.status === 413) {
        errorMessage = 'Images are too large. Please use smaller images.'
      } else if (response.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.'
      } else if (response.status >= 500) {
        errorMessage = 'Service temporarily unavailable. Please try again.'
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        validation_results: [],
        valid_products: [],
        rejected_images: [],
        can_proceed: false
      }, { status: response.status })
    }

    let data: any
    try {
      data = await response.json()
    } catch (parseError) {
      console.error('Failed to parse validation response:', parseError)
      return NextResponse.json({
        success: false,
        error: 'Invalid response from validation service.',
        validation_results: [],
        valid_products: [],
        rejected_images: [],
        can_proceed: false
      }, { status: 502 })
    }

    // Ensure proper response structure with proper typing
    const validationResponse: {
      success: boolean
      validation_results: any[]
      valid_products: any[]
      rejected_images: any[]
      can_proceed: boolean
      message: string
      error?: string
    } = {
      success: data.success || false,
      validation_results: data.validation_results || [],
      valid_products: data.valid_products || [],
      rejected_images: data.rejected_images || [],
      can_proceed: data.can_proceed || false,
      message: data.message || (data.success ? 'Validation completed' : 'Validation failed')
    }

    // Safely add error if it exists
    if (data.error) {
      validationResponse.error = data.error
    }

    console.log(`✅ Validation completed: ${validationResponse.valid_products.length} valid, ${validationResponse.rejected_images.length} rejected`)
    
    return NextResponse.json(validationResponse)
    
  } catch (error) {
    console.error('Validation API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Validation service error. Please try again.',
      validation_results: [],
      valid_products: [],
      rejected_images: [],
      can_proceed: false
    }, { status: 500 })
  }
}