'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, Loader2, Download, AlertCircle, Sparkles, Image as ImageIcon, Wand2, Instagram, Facebook, MonitorPlay, CreditCard, BarChart3, Clock, CheckCircle, X, Package, User, Settings, StopCircle, Home, History, ArrowLeft, Eye, EyeOff } from 'lucide-react'

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

interface ValidationResult {
  is_product: boolean
  category: string
  confidence: number
  description: string
  product_name?: string
  product_type?: string
  rejection_reason?: string
  original_image: any
  index: number
}

interface ProcessedResult {
  success: boolean
  error?: string
  cancelled?: boolean
  validation_results?: ValidationResult[]
  descriptions?: string[]
  products?: Array<{
    product_name: string
    product_type: string
    brand_name?: string
  }>
  prompts?: string[]
  generated_images?: GeneratedImage[]
  has_avatar?: boolean
  avatar_type?: string
  sessionId?: string
  message?: string
  can_proceed?: boolean
}

const IMAGE_SIZES = {
  instagram: {
    label: 'Instagram Reels',
    size: '1080x1920',
    icon: Instagram,
    description: 'Vertical format (9:16) for Instagram Reels',
    aspect: 'Vertical',
    credits: 1
  },
  facebook: {
    label: 'Facebook Photo Ad',
    size: '1080x1080',
    icon: Facebook,
    description: 'Square format (1:1) for Facebook feed',
    aspect: 'Square',
    credits: 1
  },
  youtube: {
    label: 'YouTube Banner',
    size: '2560x1440',
    icon: MonitorPlay,
    description: 'Widescreen format (16:9) for all devices',
    aspect: 'Landscape',
    credits: 1
  }
}

// Fun loading messages
const LOADING_MESSAGES = [
  "🎨 Analyzing your products with AI vision...",
  "🔍 Detecting product features and details...",
  "✨ Creating amazing marketing concepts...",
  "🎬 Setting up the perfect scenes...",
  "🌟 Adding creative magic to your products...",
  "🚀 Almost there, preparing your visuals..."
]

interface DashboardContentProps {
  profile: any
  stats: any
}

export function DashboardContent({ profile, stats }: DashboardContentProps) {
  const [files, setFiles] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ProcessedResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [generateImages, setGenerateImages] = useState(true)
  const [selectedSize, setSelectedSize] = useState<keyof typeof IMAGE_SIZES>('instagram')
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingStep, setProcessingStep] = useState('')
  const [cancelRequested, setCancelRequested] = useState(false)
  
  // NEW: Image validation states
  const [showValidation, setShowValidation] = useState(false)
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [validating, setValidating] = useState(false)
  const [canProceed, setCanProceed] = useState(false)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const creditsRemaining = stats?.credits_remaining || 0
  const validProducts = validationResults.filter(r => r.is_product && r.confidence > 0.7)
  const requiredCredits = generateImages ? validProducts.length * 3 : 0

  // Navigation component
  const Navigation = () => (
    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-8 shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Welcome back, {profile.full_name || profile.username || 'Creator'}!</h1>
          <p className="text-white/80">Create amazing content with AI</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={() => router.push('/dashboard/history')}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button
            onClick={() => router.push('/dashboard/stats')}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            <BarChart3 className="w-4 h-4" />
            Stats
          </button>
        </div>
      </div>
    </div>
  )

  // Rotate loading messages
  const startLoadingMessages = () => {
    let index = 0
    const interval = setInterval(() => {
      index = (index + 1) % LOADING_MESSAGES.length
      setLoadingMessage(LOADING_MESSAGES[index])
    }, 3000)
    return () => clearInterval(interval)
  }

  // Cancel processing
  const cancelProcessing = () => {
    setCancelRequested(true)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setProcessing(false)
    setProcessingStep('')
    setUploadProgress(0)
    // Don't show cancellation message
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    )
    setFiles(prev => [...prev, ...droppedFiles])
    
    // Auto-validate new files
    if (droppedFiles.length > 0) {
      validateImages([...files, ...droppedFiles])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(
        file => file.type.startsWith('image/')
      )
      setFiles(prev => [...prev, ...selectedFiles])
      
      // Auto-validate new files
      if (selectedFiles.length > 0) {
        validateImages([...files, ...selectedFiles])
      }
    }
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    
    // Re-validate remaining files
    if (newFiles.length > 0) {
      validateImages(newFiles)
    } else {
      setValidationResults([])
      setCanProceed(false)
      setShowValidation(false)
    }
  }

  // NEW: Validate images function
  const validateImages = async (filesToValidate: File[] = files) => {
    if (filesToValidate.length === 0) return

    setValidating(true)
    setShowValidation(true)

    try {
      // Convert files to base64
      const imagePromises = filesToValidate.map((file) => {
        return new Promise<{ base64: string; filename: string }>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const base64 = e.target?.result as string
            resolve({
              base64: base64.split(',')[1],
              filename: file.name
            })
          }
          reader.readAsDataURL(file)
        })
      })

      const images = await Promise.all(imagePromises)

      // Call validation API
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ images })
      })

      const data = await response.json()

      if (data.success) {
        setValidationResults(data.validation_results || [])
        setCanProceed(data.can_proceed || false)
      } else {
        setValidationResults([])
        setCanProceed(false)
      }

    } catch (error) {
      console.error('Validation error:', error)
      setValidationResults([])
      setCanProceed(false)
    } finally {
      setValidating(false)
    }
  }

  const downloadImage = (image: GeneratedImage) => {
    const sizeConfig = IMAGE_SIZES[selectedSize]
    const link = document.createElement('a')
    link.href = `data:image/jpeg;base64,${image.image_base64}`
    link.download = `visual-god-${sizeConfig.label.toLowerCase().replace(/\s+/g, '-')}-${image.product_name?.toLowerCase().replace(/\s+/g, '-') || 'product'}-${image.prompt_type || image.index + 1}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const processImages = async () => {
    if (!canProceed) {
      alert('Please upload valid product images before proceeding.')
      return
    }

    // Check credits
    if (generateImages && creditsRemaining < requiredCredits) {
      alert(`Not enough credits. You need ${requiredCredits} credits but only have ${creditsRemaining}.`)
      return
    }

    setProcessing(true)
    setResult(null)
    setUploadProgress(0)
    setCancelRequested(false)
    
    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    // Start loading messages rotation
    const stopMessages = startLoadingMessages()

    try {
      // Convert files to base64
      setProcessingStep('Converting images...')
      const imagePromises = files.map((file, index) => {
        return new Promise<{ base64: string; filename: string }>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const base64 = e.target?.result as string
            setUploadProgress(((index + 1) / files.length) * 30)
            resolve({
              base64: base64.split(',')[1],
              filename: file.name
            })
          }
          reader.readAsDataURL(file)
        })
      })

      const images = await Promise.all(imagePromises)
      
      if (cancelRequested) {
        return // Exit silently on cancellation
      }

      setUploadProgress(30)

      // Create session in database
      setProcessingStep('Creating session...')
      const { data: session, error: sessionError } = await supabase
        .from('generation_sessions')
        .insert({
          user_id: profile.id,
          session_name: `Session ${new Date().toLocaleString()}`,
          status: 'processing',
          metadata: {
            platform: selectedSize,
            product_count: validProducts.length
          }
        })
        .select()
        .single()

      if (sessionError) {
        console.error('Session error:', sessionError)
        throw new Error('Failed to create session')
      }
      
      setUploadProgress(40)

      // Store uploaded images
      for (const [index, img] of images.entries()) {
        await supabase.from('uploaded_images').insert({
          session_id: session.id,
          user_id: profile.id,
          filename: img.filename,
          file_path: `${profile.id}/${session.id}/uploaded_${index}.jpg`,
          metadata: { base64: img.base64 }
        })
      }

      // Call API with abort signal
      setProcessingStep('Processing with AI...')
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images,
          userId: profile.id,
          sessionId: session.id,
          generate_images: generateImages,
          image_size: selectedSize
        }),
        signal: abortControllerRef.current.signal
      })

      setUploadProgress(70)

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('Image files are too large. Please use smaller images (under 4MB each).')
        }
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      
      if (cancelRequested) {
        return // Exit silently on cancellation
      }
      
      setUploadProgress(90)
      
      // Update session status
      const creditsUsed = generateImages && data.generated_images ? data.generated_images.length : 0
      
      await supabase
        .from('generation_sessions')
        .update({
          status: data.success ? 'completed' : 'failed',
          credits_used: creditsUsed
        })
        .eq('id', session.id)

      // Save generated images to database
      if (data.success && data.generated_images && session.id) {
        for (const [index, img] of data.generated_images.entries()) {
          await supabase.from('generated_images').insert({
            session_id: session.id,
            user_id: profile.id,
            filename: `generated_${img.product_name}_${img.prompt_type}.jpg`,
            file_path: `${profile.id}/${session.id}/generated_${index}.jpg`,
            prompt_text: img.prompt,
            prompt_index: index,
            platform: selectedSize,
            size: img.size,
            metadata: { 
              base64: img.image_base64,
              product_name: img.product_name,
              prompt_type: img.prompt_type
            }
          })
        }
      }

      // Log usage if successful
      if (data.success && creditsUsed > 0) {
        await supabase.from('usage_logs').insert({
          user_id: profile.id,
          session_id: session.id,
          action: 'image_generation',
          credits_used: creditsUsed,
          metadata: { 
            platform: selectedSize, 
            image_count: creditsUsed,
            product_count: validProducts.length
          }
        })

        // Update user credits
        await supabase
          .from('profiles')
          .update({
            credits_used: profile.credits_used + creditsUsed
          })
          .eq('id', profile.id)
      }

      setUploadProgress(100)
      setResult(data)
      router.refresh() // Refresh to update credits

    } catch (error: any) {
      if (error.name === 'AbortError' || cancelRequested) {
        // Handle cancellation silently - don't show error
        return
      } else {
        setResult({
          success: false,
          error: error instanceof Error ? error.message : 'Processing failed'
        })
      }
    } finally {
      setProcessing(false)
      setProcessingStep('')
      stopMessages()
      abortControllerRef.current = null
    }
  }

  const reset = () => {
    setFiles([])
    setResult(null)
    setUploadProgress(0)
    setValidationResults([])
    setCanProceed(false)
    setShowValidation(false)
    setCancelRequested(false)
  }

  // Validation Results Component
  const ValidationResults = () => {
    if (!showValidation || validationResults.length === 0) return null

    const validProducts = validationResults.filter(r => r.is_product && r.confidence > 0.7)
    const rejectedImages = validationResults.filter(r => !(r.is_product && r.confidence > 0.7))

    return (
      <div className="mt-6 bg-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Image Analysis Results
          </h3>
          <button
            onClick={() => setShowValidation(!showValidation)}
            className="text-white/60 hover:text-white"
          >
            {showValidation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {validating ? (
          <div className="text-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-white mx-auto mb-2" />
            <p className="text-white/80">Analyzing images...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Valid Products */}
            {validProducts.length > 0 && (
              <div>
                <h4 className="text-green-300 font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Valid Products ({validProducts.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {validProducts.map((result, i) => (
                    <div key={i} className="bg-green-500/20 border border-green-500/40 rounded-lg p-3">
                      <p className="text-green-200 font-medium">{result.product_name || 'Product'}</p>
                      <p className="text-green-300/80 text-sm">{result.description}</p>
                      <p className="text-green-300/60 text-xs">Confidence: {(result.confidence * 100).toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Images */}
            {rejectedImages.length > 0 && (
              <div>
                <h4 className="text-red-300 font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Rejected Images ({rejectedImages.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rejectedImages.map((result, i) => (
                    <div key={i} className="bg-red-500/20 border border-red-500/40 rounded-lg p-3">
                      <p className="text-red-200 font-medium">{result.category}</p>
                      <p className="text-red-300/80 text-sm">{result.description}</p>
                      {result.rejection_reason && (
                        <p className="text-red-300/60 text-xs">{result.rejection_reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Proceed Button */}
            <div className="mt-4 p-4 bg-white/5 rounded-lg">
              {canProceed ? (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-green-300">
                    Ready to proceed! Found {validProducts.length} valid product{validProducts.length !== 1 ? 's' : ''}.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-300">
                    Cannot proceed. Please upload at least one clear product image.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-8">
        <div className="max-w-6xl mx-auto">
          <Navigation />
          
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <Sparkles className="w-10 h-10" />
                Visual God Results
              </h1>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 rounded-xl px-4 py-2">
                  <span className="text-white/80 text-sm">Credits:</span>
                  <span className="text-white font-semibold ml-2">{creditsRemaining - (result.generated_images?.length || 0)}</span>
                </div>
              </div>
            </div>

            {result.success ? (
              <div className="space-y-8">
                {/* Success Animation */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4 animate-pulse">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white mb-2">Processing Complete!</h2>
                  <p className="text-white/80">{result.message}</p>
                </div>

                {/* Products Detected */}
                {result.products && result.products.length > 0 && (
                  <div className="bg-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Products Detected ({result.products.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.products.map((product, i) => (
                        <div key={i} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition duration-200">
                          <p className="text-white font-medium">{product.product_name}</p>
                          <p className="text-white/60 text-sm">Type: {product.product_type}</p>
                          {product.brand_name && (
                            <p className="text-white/60 text-sm">Brand: {product.brand_name}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generated Images */}
                {result.generated_images && result.generated_images.length > 0 && (
                  <div className="bg-white/10 rounded-xl p-6">
                    <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                      <Wand2 className="w-8 h-8" />
                      AI-Enhanced Images ({result.generated_images.length})
                      <span className="text-sm font-normal bg-white/20 px-2 py-1 rounded-full">
                        {IMAGE_SIZES[selectedSize].size}
                      </span>
                    </h2>

                    {/* Group images by product */}
                    {result.products && result.products.map((product, productIdx) => {
                      const productImages = result.generated_images?.filter(
                        img => img.product_name === product.product_name
                      ) || []
                      
                      if (productImages.length === 0) return null

                      return (
                        <div key={productIdx} className="mb-8">
                          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            {product.product_name}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {productImages.map((image, i) => (
                              <div key={i} className="bg-white/5 rounded-lg overflow-hidden transform hover:scale-105 transition-all duration-200 hover:shadow-xl">
                                <div className={`relative group ${
                                  selectedSize === 'instagram' ? 'aspect-[9/16]' : 
                                  selectedSize === 'facebook' ? 'aspect-square' : 
                                  'aspect-[16/9]'
                                }`}>
                                  <img
                                    src={`data:image/jpeg;base64,${image.image_base64}`}
                                    alt={`${image.product_name} - ${image.prompt_type}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                                      Style {image.prompt_type?.replace('style_', '')}
                                    </span>
                                  </div>
                                </div>
                                <div className="p-4">
                                  <button
                                    onClick={() => downloadImage(image)}
                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-105"
                                  >
                                    <Download className="w-4 h-4" />
                                    Download
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <button
                  onClick={reset}
                  className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Process New Images
                </button>
              </div>
            ) : (
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
                <p className="text-white text-lg mb-2">{result.error}</p>
                {result.message && (
                  <p className="text-white/80 text-sm mb-6">{result.message}</p>
                )}
                <button
                  onClick={reset}
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-8">
      <div className="max-w-6xl mx-auto">
        <Navigation />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60">Plan</span>
              <CreditCard className="w-5 h-5 text-white/40" />
            </div>
            <p className="text-2xl font-bold text-white capitalize">{profile.plan}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60">Credits</span>
              <Sparkles className="w-5 h-5 text-white/40" />
            </div>
            <p className="text-2xl font-bold text-white">{creditsRemaining}/{profile.credits_total}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60">Total Images</span>
              <ImageIcon className="w-5 h-5 text-white/40" />
            </div>
            <p className="text-2xl font-bold text-white">{stats?.total_images_generated || 0}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60">Sessions</span>
              <Wand2 className="w-5 h-5 text-white/40" />
            </div>
            <p className="text-2xl font-bold text-white">{stats?.total_sessions || 0}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Create New Content</h2>

          {/* Processing Overlay */}
          {processing && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md w-full mx-4 border border-white/20">
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto w-12 h-12 text-white animate-pulse" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4">Creating Magic ✨</h3>
                  
                  <div className="mb-6">
                    <p className="text-white/80 mb-2">{loadingMessage}</p>
                    {processingStep && (
                      <p className="text-white/60 text-sm">{processingStep}</p>
                    )}
                  </div>
                  
                  <div className="w-full bg-white/20 rounded-full h-2 mb-4">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  
                  <p className="text-white/60 text-sm mb-4">
                    This usually takes 30-60 seconds depending on the number of images
                  </p>
                  
                  <button
                    onClick={cancelProcessing}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-6 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 mx-auto transform hover:scale-105"
                  >
                    <StopCircle className="w-4 h-4" />
                    Cancel Processing
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
              dragActive ? 'border-white bg-white/10 scale-105' : 'border-white/30 hover:border-white/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-16 h-16 text-white/60 mx-auto mb-4" />
            <p className="text-white text-lg mb-2">Drag & drop product images here</p>
            <p className="text-white/60 mb-4">or</p>
            <label className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-6 rounded-xl cursor-pointer transition-all duration-200 inline-block transform hover:scale-105">
              Browse Files
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <p className="text-white/40 text-sm mt-4">
              Upload product images only (no people/avatars) • JPEG, PNG, WEBP • Max 4MB each
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-2">
              {files.map((file, i) => (
                <div key={i} className="bg-white/10 rounded-lg p-3 flex items-center justify-between group hover:bg-white/15 transition-all duration-200">
                  <div className="flex items-center gap-3 flex-1">
                    <ImageIcon className="w-5 h-5 text-white/60" />
                    <span className="text-white text-sm truncate flex-1">{file.name}</span>
                    <span className="text-white/40 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button
                    onClick={() => removeFile(i)}
                    className="text-white/40 hover:text-white ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Validation Results */}
          <ValidationResults />

          {/* Options */}
          {files.length > 0 && (
            <>
              {/* Platform Selection */}
              <div className="mt-6 bg-white/5 rounded-xl p-6">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Choose Platform Format
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(IMAGE_SIZES).map(([key, config]) => {
                    const IconComponent = config.icon
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedSize(key as keyof typeof IMAGE_SIZES)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-left transform hover:scale-105 ${
                          selectedSize === key
                            ? 'border-white bg-white/10 text-white scale-105'
                            : 'border-white/30 hover:border-white/50 text-white/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <IconComponent className="w-5 h-5" />
                          <span className="font-medium">{config.label}</span>
                        </div>
                        <p className="text-xs opacity-80 font-mono">{config.size}</p>
                        <p className="text-xs opacity-60">{config.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Generate Images Toggle */}
              <div className="mt-6 flex items-center justify-between bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all duration-200">
                <div>
                  <h3 className="text-white font-medium">AI Image Enhancement</h3>
                  <p className="text-white/60 text-sm">
                    Generate 3 creative styles per product ({requiredCredits} total credits)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateImages}
                    onChange={(e) => setGenerateImages(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500"></div>
                </label>
              </div>

              {/* Credits Info */}
              <div className="mt-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-white/20">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Credits Information
                </h4>
                <ul className="text-white/80 text-sm space-y-1">
                  <li>• Each valid product generates 3 unique marketing styles</li>
                  <li>• {validProducts.length} valid product{validProducts.length !== 1 ? 's' : ''} × 3 styles = {requiredCredits} credits needed</li>
                  <li>• You have {creditsRemaining} credits available</li>
                </ul>
              </div>

              {/* Credits Warning */}
              {generateImages && creditsRemaining < requiredCredits && (
                <div className="mt-4 bg-red-500/20 border border-red-500/40 rounded-lg p-4">
                  <p className="text-red-200 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Not enough credits. You need {requiredCredits} credits but only have {creditsRemaining}.
                    <a href="/pricing" className="underline ml-1 hover:text-red-100">Get more credits</a>
                  </p>
                </div>
              )}

              {/* Cannot Proceed Warning */}
              {!canProceed && files.length > 0 && (
                <div className="mt-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-4">
                  <p className="text-yellow-200 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Please upload at least one valid product image to proceed with generation.
                  </p>
                </div>
              )}

              <button
                onClick={processImages}
                disabled={processing || !canProceed || (generateImages && creditsRemaining < requiredCredits)}
                className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 disabled:hover:scale-100"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Create Marketing Visuals
                    {generateImages && canProceed && ` (${requiredCredits} credits)`}
                  </>
                )}
              </button>
            </>
          )}

          {/* How It Works */}
          {files.length === 0 && (
            <div className="mt-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-white/20">
              <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                How it works
              </h4>
              <ul className="text-white/80 text-sm space-y-1">
                <li>• Upload clear product photos (no people or avatars)</li>
                <li>• AI automatically validates and categorizes your images</li>
                <li>• Review which images are accepted as valid products</li>
                <li>• Get 3 unique marketing styles per valid product:</li>
                <li className="ml-4">- Street-level giant product perspective</li>
                <li className="ml-4">- 3D billboard advertisement style</li>
                <li className="ml-4">- Premium editorial catalog layout</li>
                <li>• Download and use on your chosen platform</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}