// File: visual-god-app/frontend/app/api/process/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const BACKEND_URL = process.env.BACKEND_URL || 'visio-production-ec6a.up.railway.app'

// Type definitions
interface GeneratedImage {
  prompt: string
  image_base64: string
  image_url?: string
  index: number
  input_image?: string
  size?: string
  product_name?: string
  prompt_type?: string
}

interface UploadedImage extends GeneratedImage {
  storage_url: string
  database_id: string
}

interface BackendResponse {
  success: boolean
  error?: string
  generated_images?: GeneratedImage[]
  [key: string]: any
}

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
    
    // Updated credit calculation for product-only workflow (3 images per product)
    const creditsPerProduct = image_size === 'youtube' ? 6 : 3 // 3 images per product, 2x for YouTube
    const estimatedProducts = images.length // Assuming 1 product per uploaded image
    const requiredCredits = generate_images ? (estimatedProducts * creditsPerProduct) : 0
    
    // Check user credits
    const { data: canProceed } = await supabase.rpc('check_user_credits', {
      user_id: user.id,
      required_credits: requiredCredits
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

    const data: BackendResponse = await response.json()
    
    // Save generated images to Supabase Storage and database if successful
    if (data.success && data.generated_images && sessionId) {
      const uploadedImages: UploadedImage[] = []
      
      for (const [index, img] of data.generated_images.entries()) {
        try {
          // Convert base64 to buffer
          const base64Data = img.image_base64
          const imageBuffer = Buffer.from(base64Data, 'base64')
          
          // Generate filename with product and style info
          const productName = img.product_name?.replace(/\s+/g, '-').toLowerCase() || 'product'
          const styleType = img.prompt_type || `style-${(index % 3) + 1}`
          const timestamp = Date.now()
          const filename = `${productName}-${styleType}-${timestamp}.jpg`
          const filePath = `${user.id}/${sessionId}/${filename}`
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('generated-images')
            .upload(filePath, imageBuffer, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            console.error('Upload error:', uploadError)
            throw uploadError
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('generated-images')
            .getPublicUrl(filePath)

          // Save to database with storage path
          const { data: dbData, error: dbError } = await supabase
            .from('generated_images')
            .insert({
              session_id: sessionId,
              user_id: user.id,
              filename: filename,
              file_path: filePath,
              file_size: imageBuffer.length,
              mime_type: 'image/jpeg',
              prompt_text: img.prompt,
              prompt_index: index,
              platform: image_size,
              size: img.size,
              metadata: { 
                public_url: urlData.publicUrl,
                storage_path: filePath,
                original_filename: filename,
                product_name: img.product_name,
                prompt_type: img.prompt_type,
                base64: img.image_base64 // Keep base64 as fallback
              }
            })
            .select()
            .single()

          if (dbError) {
            console.error('Database error:', dbError)
            // If database insert fails, clean up uploaded file
            await supabase.storage
              .from('generated-images')
              .remove([filePath])
            throw dbError
          }

          const uploadedImage: UploadedImage = {
            ...img,
            storage_url: urlData.publicUrl,
            database_id: dbData.id
          }
          
          uploadedImages.push(uploadedImage)

          console.log(`✅ Uploaded image ${index + 1} to: ${filePath}`)

        } catch (error) {
          console.error(`❌ Failed to upload image ${index + 1}:`, error)
          // Continue with other images even if one fails
        }
      }

      // Update the response with storage URLs
      data.generated_images = data.generated_images.map((img, index) => {
        const uploaded = uploadedImages.find(u => u.index === img.index)
        return {
          ...img,
          storage_url: uploaded?.storage_url || null,
          database_id: uploaded?.database_id || null
        }
      })

      console.log(`✅ Successfully uploaded ${uploadedImages.length}/${data.generated_images.length} images to storage`)
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