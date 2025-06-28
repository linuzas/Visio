'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, Loader2, Download, AlertCircle, Sparkles, Image as ImageIcon, Wand2, Instagram, Facebook, MonitorPlay, CreditCard, LogOut, BarChart3, Clock, CheckCircle, X } from 'lucide-react'

interface GeneratedImage {
  prompt: string
  image_base64: string
  image_url?: string
  index: number
  input_image?: string
  size?: string
}

interface ProcessedResult {
  success: boolean
  error?: string
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
    credits: 2
  }
}

// Fun loading messages
const LOADING_MESSAGES = [
  "🎨 Analyzing your images with AI vision...",
  "🔍 Detecting products and their features...",
  "✨ Preparing creative prompts...",
  "🎬 Setting up the perfect scene...",
  "🌟 Adding some marketing magic...",
  "🚀 Almost there, creating something amazing..."
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
  const router = useRouter()
  const supabase = createClient()

  const creditsRemaining = stats?.credits_remaining || 0
  const requiredCredits = generateImages ? IMAGE_SIZES[selectedSize].credits : 0

  // Rotate loading messages
  const startLoadingMessages = () => {
    let index = 0
    const interval = setInterval(() => {
      index = (index + 1) % LOADING_MESSAGES.length
      setLoadingMessage(LOADING_MESSAGES[index])
    }, 3000)
    return () => clearInterval(interval)
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
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(
        file => file.type.startsWith('image/')
      )
      setFiles(prev => [...prev, ...selectedFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const downloadImage = (image: GeneratedImage) => {
    const sizeConfig = IMAGE_SIZES[selectedSize]
    const link = document.createElement('a')
    link.href = `data:image/jpeg;base64,${image.image_base64}`
    link.download = `visual-god-${sizeConfig.label.toLowerCase().replace(/\s+/g, '-')}-${image.index + 1}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const processImages = async () => {
    if (files.length === 0) return

    // Check credits
    if (generateImages && creditsRemaining < requiredCredits) {
      alert(`Not enough credits. You need ${requiredCredits} credits but only have ${creditsRemaining}.`)
      return
    }

    setProcessing(true)
    setResult(null)
    setUploadProgress(0)
    
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
      setUploadProgress(30)

      // Create session in database
      setProcessingStep('Creating session...')
      const { data: session, error: sessionError } = await supabase
        .from('generation_sessions')
        .insert({
          user_id: profile.id,
          session_name: `Session ${new Date().toLocaleString()}`,
          status: 'processing'
        })
        .select()
        .single()

      if (sessionError) throw sessionError
      setUploadProgress(40)

      // Call API
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
      })

      setUploadProgress(70)

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      setUploadProgress(90)
      
      // Update session status
      await supabase
        .from('generation_sessions')
        .update({
          status: data.success ? 'completed' : 'failed',
          credits_used: generateImages ? requiredCredits : 0
        })
        .eq('id', session.id)

      // Log usage if successful
      if (data.success && generateImages) {
        await supabase.from('usage_logs').insert({
          user_id: profile.id,
          session_id: session.id,
          action: 'image_generation',
          credits_used: requiredCredits,
          metadata: { platform: selectedSize, image_count: data.generated_images?.length || 0 }
        })
      }

      setUploadProgress(100)
      setResult(data)
      router.refresh() // Refresh to update credits

    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed'
      })
    } finally {
      setProcessing(false)
      setProcessingStep('')
      stopMessages()
    }
  }

  const reset = () => {
    setFiles([])
    setResult(null)
    setUploadProgress(0)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <Sparkles className="w-10 h-10" />
                Visual God Results
              </h1>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 rounded-xl px-4 py-2">
                  <span className="text-white/80 text-sm">Credits:</span>
                  <span className="text-white font-semibold ml-2">{creditsRemaining}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-white/80 hover:text-white transition"
                >
                  <LogOut className="w-5 h-5" />
                </button>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {result.generated_images.map((image, i) => (
                        <div key={i} className="bg-white/5 rounded-lg overflow-hidden transform hover:scale-105 transition-all">
                          <div className={`relative group ${
                            selectedSize === 'instagram' ? 'aspect-[9/16]' : 
                            selectedSize === 'facebook' ? 'aspect-square' : 
                            'aspect-[16/9]'
                          }`}>
                            <img
                              src={`data:image/jpeg;base64,${image.image_base64}`}
                              alt={`Generated ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="p-4">
                            <p className="text-white/80 text-sm mb-3 line-clamp-2">
                              {image.prompt}
                            </p>
                            <button
                              onClick={() => downloadImage(image)}
                              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Details */}
                {result.products && result.products.length > 0 && (
                  <div className="bg-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Products Detected</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.products.map((product, i) => (
                        <div key={i} className="bg-white/5 rounded-lg p-4">
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

                <button
                  onClick={reset}
                  className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Process New Images
                </button>
              </div>
            ) : (
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
                <p className="text-white text-lg mb-6">{result.error}</p>
                <button
                  onClick={reset}
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
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
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Welcome back, {profile.full_name || profile.username || 'Creator'}!</h1>
              <p className="text-white/80">Create amazing content with AI</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/history')}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition"
              >
                <Clock className="w-4 h-4" />
                History
              </button>
              <button
                onClick={() => router.push('/dashboard/stats')}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition"
              >
                <BarChart3 className="w-4 h-4" />
                Stats
              </button>
              <button
                onClick={handleLogout}
                className="text-white/80 hover:text-white transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60">Plan</span>
              <CreditCard className="w-5 h-5 text-white/40" />
            </div>
            <p className="text-2xl font-bold text-white capitalize">{profile.plan}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60">Credits</span>
              <Sparkles className="w-5 h-5 text-white/40" />
            </div>
            <p className="text-2xl font-bold text-white">{creditsRemaining}/{profile.credits_total}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60">Total Images</span>
              <ImageIcon className="w-5 h-5 text-white/40" />
            </div>
            <p className="text-2xl font-bold text-white">{stats?.total_images_generated || 0}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
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
                  
                  <p className="text-white/60 text-sm">
                    This usually takes 30-60 seconds depending on the number of images
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              dragActive ? 'border-white bg-white/10' : 'border-white/30 hover:border-white/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-16 h-16 text-white/60 mx-auto mb-4" />
            <p className="text-white text-lg mb-2">Drag & drop images here</p>
            <p className="text-white/60 mb-4">or</p>
            <label className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-6 rounded-xl cursor-pointer transition-colors inline-block">
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
              Supported formats: JPEG, PNG, WEBP (Max 10MB per file)
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-2">
              {files.map((file, i) => (
                <div key={i} className="bg-white/10 rounded-lg p-3 flex items-center justify-between group hover:bg-white/15 transition">
                  <div className="flex items-center gap-3 flex-1">
                    <ImageIcon className="w-5 h-5 text-white/60" />
                    <span className="text-white text-sm truncate flex-1">{file.name}</span>
                    <span className="text-white/40 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button
                    onClick={() => removeFile(i)}
                    className="text-white/40 hover:text-white ml-2 opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Options */}
          {files.length > 0 && (
            <>
              {/* Image Size Selection */}
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
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          selectedSize === key
                            ? 'border-white bg-white/10 text-white'
                            : 'border-white/30 hover:border-white/50 text-white/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <IconComponent className="w-5 h-5" />
                          <span className="font-medium">{config.label}</span>
                        </div>
                        <p className="text-xs opacity-80 font-mono">{config.size}</p>
                        <p className="text-xs opacity-60">{config.description}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            config.aspect === 'Vertical' ? 'bg-blue-500/30' :
                            config.aspect === 'Square' ? 'bg-green-500/30' :
                            'bg-purple-500/30'
                          }`}>
                            {config.aspect}
                          </span>
                          <span className="text-xs text-white/60">{config.credits} credit{config.credits > 1 ? 's' : ''}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Generate Images Toggle */}
              <div className="mt-6 flex items-center justify-between bg-white/5 rounded-xl p-4">
                <div>
                  <h3 className="text-white font-medium">AI Image Enhancement</h3>
                  <p className="text-white/60 text-sm">
                    Create enhanced marketing images ({requiredCredits} credit{requiredCredits > 1 ? 's' : ''})
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

              {/* Credits Warning */}
              {generateImages && creditsRemaining < requiredCredits && (
                <div className="mt-4 bg-red-500/20 border border-red-500/40 rounded-lg p-4">
                  <p className="text-red-200 text-sm">
                    ⚠️ Not enough credits. You need {requiredCredits} credits but only have {creditsRemaining}.
                    <a href="/pricing" className="underline ml-1">Upgrade your plan</a>
                  </p>
                </div>
              )}

              <button
                onClick={processImages}
                disabled={processing || (generateImages && creditsRemaining < requiredCredits)}
                className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {generateImages ? <Wand2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                    Create {IMAGE_SIZES[selectedSize].label}
                    {generateImages && ` (${requiredCredits} credit${requiredCredits > 1 ? 's' : ''})`}
                  </>
                )}
              </button>
            </>
          )}

          {/* Product Scanner Notice */}
          {files.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-white/20">
              <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                How it works
              </h4>
              <ul className="text-white/80 text-sm space-y-1">
                <li>• Upload product photos, avatars, or both</li>
                <li>• AI scans and identifies your products automatically</li>
                <li>• Get professionally enhanced marketing visuals</li>
                <li>• Download and use on your chosen platform</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}