'use client'

import { useState, useCallback } from 'react'
import { Upload, Loader2, Download, AlertCircle, Sparkles, Image as ImageIcon, Wand2, Instagram, Facebook, MonitorPlay } from 'lucide-react'

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

// 🎯 UPDATED: New image size configurations
const IMAGE_SIZES = {
  instagram: {
    label: 'Instagram Reels',
    size: '1080x1920',
    icon: Instagram,
    description: 'Vertical format (9:16) for Instagram Reels',
    aspect: 'Vertical'
  },
  facebook: {
    label: 'Facebook Photo Ad',
    size: '1080x1080',
    icon: Facebook,
    description: 'Square format (1:1) for Facebook feed',
    aspect: 'Square'
  },
  youtube: {
    label: 'YouTube Banner',
    size: '2560x1440',
    icon: MonitorPlay,
    description: 'Widescreen format (16:9) for all devices',
    aspect: 'Landscape'
  }
}

export default function VisualGodApp() {
  const [files, setFiles] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ProcessedResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [generateImages, setGenerateImages] = useState(true)
  const [selectedSize, setSelectedSize] = useState<keyof typeof IMAGE_SIZES>('instagram')

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    )
    setFiles(prev => [...prev, ...droppedFiles])
  }, [])

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

    try {
      // Convert files to base64
      const imagePromises = files.map(file => {
        return new Promise<{ base64: string; filename: string }>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const base64 = e.target?.result as string
            resolve({
              base64: base64.split(',')[1], // Remove data:image/jpeg;base64, prefix
              filename: file.name
            })
          }
          reader.readAsDataURL(file)
        })
      })

      const images = await Promise.all(imagePromises)

      // Call API with size configuration
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images,
          userId: null,
          generate_images: generateImages,
          image_size: selectedSize // Add size parameter
        }),
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)

    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed'
      })
    } finally {
      setProcessing(false)
    }
  }

  const reset = () => {
    setFiles([])
    setResult(null)
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
            <h1 className="text-4xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
              <Sparkles className="w-10 h-10" />
              Visual God Results
            </h1>

            {result.success ? (
              <div className="space-y-8">
                {/* Generated Images - Feature prominently */}
                {result.generated_images && result.generated_images.length > 0 && (
                  <div className="bg-white/10 rounded-xl p-6">
                    <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                      <Wand2 className="w-8 h-8" />
                      AI-Enhanced Images ({result.generated_images.length})
                      <span className="text-sm font-normal bg-white/20 px-2 py-1 rounded-full">
                        {IMAGE_SIZES[selectedSize].size}
                      </span>
                      <span className="text-sm font-normal bg-white/20 px-2 py-1 rounded-full">
                        {IMAGE_SIZES[selectedSize].aspect}
                      </span>
                      <span className="text-sm font-normal bg-white/20 px-2 py-1 rounded-full">GPT-Image-1</span>
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
                              alt={`AI-enhanced ${IMAGE_SIZES[selectedSize].label} ${i + 1}`}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            {image.input_image && (
                              <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                From: {image.input_image}
                              </div>
                            )}
                            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              {IMAGE_SIZES[selectedSize].size}
                            </div>
                          </div>
                          <div className="p-4">
                            <p className="text-white/80 text-sm mb-3 line-clamp-3">
                              {image.prompt}
                            </p>
                            <button
                              onClick={() => downloadImage(image)}
                              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download {IMAGE_SIZES[selectedSize].label}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-white/60 text-sm">
                        ✨ Images enhanced using GPT-Image-1 in {IMAGE_SIZES[selectedSize].size} format
                      </p>
                    </div>
                  </div>
                )}

                {/* Classification Results */}
                <div className="bg-white/10 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Image Classifications</h2>
                  <div className="flex flex-wrap gap-2">
                    {result.descriptions?.map((desc, i) => (
                      <span key={i} className={`px-3 py-1 rounded-full text-sm ${
                        desc === 'product' ? 'bg-green-500/30 text-green-100' :
                        desc === 'avatar' ? 'bg-blue-500/30 text-blue-100' :
                        'bg-gray-500/30 text-gray-100'
                      }`}>
                        {files[i]?.name}: {desc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Products */}
                {result.products && result.products.length > 0 && (
                  <div className="bg-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Detected Products</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.products.map((product, i) => (
                        <div key={i} className="bg-white/5 rounded-lg p-4">
                          <h3 className="text-white font-medium text-lg">{product.product_name}</h3>
                          <p className="text-white/70 text-sm">Type: {product.product_type}</p>
                          {product.brand_name && (
                            <p className="text-white/70 text-sm">Brand: {product.brand_name}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generated Prompts */}
                {result.prompts && result.prompts.length > 0 && (
                  <div className="bg-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">AI-Generated Prompts</h2>
                    <div className="space-y-3">
                      {result.prompts.map((prompt, i) => (
                        <div key={i} className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-white/90 text-sm flex-1">{prompt}</p>
                            <span className="text-white/60 text-xs font-mono bg-white/10 px-2 py-1 rounded">
                              #{i + 1}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Avatar Info */}
                {result.has_avatar && result.avatar_type && (
                  <div className="bg-blue-500/20 rounded-lg p-4">
                    <p className="text-blue-100 flex items-center gap-2">
                      <span className="text-2xl">👤</span>
                      Avatar detected: {result.avatar_type}
                    </p>
                    </div>
                )}

                {/* Success Message */}
                <div className="bg-green-500/20 rounded-lg p-4">
                  <p className="text-green-100">✅ {result.message}</p>
                </div>

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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
          <h1 className="text-4xl font-bold text-white mb-2 text-center flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10" />
            Visual God
          </h1>
          <p className="text-white/80 text-center mb-8">AI-Powered Multi-Platform Content Creator</p>

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
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            config.aspect === 'Vertical' ? 'bg-blue-500/30' :
                            config.aspect === 'Square' ? 'bg-green-500/30' :
                            'bg-purple-500/30'
                          }`}>
                            {config.aspect}
                          </span>
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
                  <p className="text-white/60 text-sm">Create enhanced marketing images using GPT-Image-1</p>
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

              <button
                onClick={processImages}
                disabled={processing}
                className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {generateImages ? 'Processing & Enhancing...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    {generateImages ? <Wand2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                    Create {IMAGE_SIZES[selectedSize].label} ({IMAGE_SIZES[selectedSize].size})
                  </>
                )}
              </button>
            </>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-white/5 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-3">How Visual God works:</h3>
            <ul className="space-y-2 text-white/80 text-sm">
              <li>📸 Upload clear product images (bottles, gadgets, cosmetics, etc.)</li>
              <li>👤 Optionally add avatar images for lifestyle content</li>
              <li>📱 Choose your target platform format:</li>
              <li className="ml-4">• <strong>Instagram Reels:</strong> 1080x1920 (9:16 vertical)</li>
              <li className="ml-4">• <strong>Facebook Ads:</strong> 1080x1080 (1:1 square)</li>
              <li className="ml-4">• <strong>YouTube Banner:</strong> 2560x1440 (16:9 widescreen)</li>
              <li>🤖 AI analyzes and classifies your images</li>
              <li>✨ Get professional marketing prompts instantly</li>
              <li>🎨 <strong>NEW:</strong> Generate enhanced marketing images using GPT-Image-1</li>
              <li>💾 Download your enhanced images for immediate use</li>
            </ul>
            
            <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-white/10">
              <p className="text-white/90 text-xs">
                <strong>Multi-Platform Optimization:</strong> Each format is specifically optimized for maximum engagement on its respective platform. Instagram Reels for vertical mobile viewing, Facebook Ads for feed placement, and YouTube Banners for all device types.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}