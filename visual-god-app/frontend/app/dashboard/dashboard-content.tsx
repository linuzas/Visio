'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, Loader2, Download, AlertCircle, Sparkles, Image as ImageIcon, Wand2, Instagram, Facebook, MonitorPlay, CreditCard, LogOut, BarChart3, Clock, User, CheckCircle, X } from 'lucide-react'

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
  
  // Add these new state variables
  const [scanResults, setScanResults] = useState<ProcessedResult | null>(null)
  const [showScanResults, setShowScanResults] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const creditsRemaining = stats?.credits_remaining || 0
  const requiredCredits = generateImages ? IMAGE_SIZES[selectedSize].credits : 0

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

    setProcessing(true)
    setResult(null)
    setScanResults(null)
    setShowScanResults(false)

    try {
      // Convert files to base64
      const imagePromises = files.map(file => {
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

      // Create session in database
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
      setCurrentSessionId(session.id)

      // First, do a scan-only request
      const scanResponse = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images,
          userId: profile.id,
          sessionId: session.id,
          generate_images: false, // Just scan first
          image_size: selectedSize
        }),
      })

      if (!scanResponse.ok) {
        throw new Error(`API Error: ${scanResponse.status}`)
      }

      const scanData = await scanResponse.json()
      
      // Show scan results
      setScanResults(scanData)
      setShowScanResults(true)
      
      // If user wants to generate images and products were found
      if (generateImages && scanData.success && scanData.products?.length > 0) {
        // Check credits
        if (creditsRemaining < requiredCredits) {
          setProcessing(false)
          alert(`Not enough credits. You need ${requiredCredits} credits but only have ${creditsRemaining}.`)
          return
        }

        // Wait a bit to show scan results
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Now generate images
        const generateResponse = await fetch('/api/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images,
            userId: profile.id,
            sessionId: session.id,
            generate_images: true,
            image_size: selectedSize
          }),
        })

        if (!generateResponse.ok) {
          throw new Error(`API Error: ${generateResponse.status}`)
        }

        const data = await generateResponse.json()
        
        // Update session status
        await supabase
          .from('generation_sessions')
          .update({
            status: data.success ? 'completed' : 'failed',
            credits_used: requiredCredits
          })
          .eq('id', session.id)

        // Log usage if successful
        if (data.success) {
          await supabase.from('usage_logs').insert({
            user_id: profile.id,
            session_id: session.id,
            action: 'image_generation',
            credits_used: requiredCredits,
            metadata: { platform: selectedSize, image_count: data.generated_images?.length || 0 }
          })
        }

        setResult(data)
        router.refresh() // Refresh to update credits
      } else {
        // Just show scan results
        setProcessing(false)
        if (!scanData.products?.length) {
          await supabase
            .from('generation_sessions')
            .update({
              status: 'failed',
              credits_used: 0
            })
            .eq('id', session.id)
        }
      }

    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed'
      })
      setProcessing(false)
    } finally {
      if (result) {
        setProcessing(false)
      }
    }
  }

  const reset = () => {
    setFiles([])
    setResult(null)
    setScanResults(null)
    setShowScanResults(false)
    setCurrentSessionId(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // If we have final results, show them
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
                        <div key={i} className="bg-white/5 rounded-lg overflow-hidden">
                          <div className={`relative group ${
                            selectedSize === 'instagram' ? 'aspect-[9/16]' : 
                            selectedSize === 'facebook' ? 'aspect-square' : 
                            'aspect-[16/9]'
                          }`}>
                            <img
                              src={`data:image/jpeg;base64,${image.image_base64}`}
                              alt={`Generated ${i + 1}`}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                          <div className="p-4">
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

  // Main dashboard view
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
                onClick={() => router.push('/profile')}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
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
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-2">
              {files.map((file, i) => (
                <div key={i} className="bg-white/10 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-white text-sm truncate flex-1">{file.name}</span>
                  <button
                    onClick={() => removeFile(i)}
                    className="text-white/60 hover:text-white ml-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Scan Results Display */}
          {showScanResults && scanResults && !result && (
            <div className="mt-6 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                Product Scan Results
              </h3>
              
              {scanResults.products && scanResults.products.length > 0 ? (
                <div className="space-y-3">
                  {scanResults.products.map((product: any, index: number) => (
                    <div key={index} className="bg-white/10 rounded-lg p-4">
                      <h4 className="text-white font-medium">{product.product_name}</h4>
                      <p className="text-white/70 text-sm">Type: {product.product_type}</p>
                      {product.brand_name && (
                        <p className="text-white/70 text-sm">Brand: {product.brand_name}</p>
                      )}
                    </div>
                  ))}
                  
                  {scanResults.has_avatar && (
                    <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-400/40">
                      <p className="text-purple-200">
                        ✨ Avatar detected: {scanResults.avatar_type}
                      </p>
                    </div>
                  )}
                  
                  {generateImages && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <p className="text-white/80 text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Ready to generate {scanResults.prompts?.length || 3} enhanced marketing images
                      </p>
                      {processing && (
                        <p className="text-white/60 text-sm mt-2 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating images...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : scanResults.has_avatar && !scanResults.products?.length ? (
                <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-400/40">
                  <p className="text-purple-200">
                    ✨ Avatar detected ({scanResults.avatar_type}), but no products found.
                  </p>
                  <p className="text-purple-200/80 text-sm mt-2">
                    Please upload at least one product image along with your avatar to generate marketing content.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-400/40">
                  <p className="text-yellow-200">
                    ⚠️ No products detected. Please upload clear product images.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Options */}
          {files.length > 0 && !showScanResults && (
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
                    {showScanResults && scanResults?.products?.length ? 'Generating Images...' : 'Scanning Products...'}
                  </>
                ) : (
                  <>
                    {generateImages ? <Wand2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                    {generateImages ? 'Scan & Generate' : 'Scan Products Only'}
                    {generateImages && ` (${requiredCredits} credit${requiredCredits > 1 ? 's' : ''})`}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}