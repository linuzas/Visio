'use client'

import { useState, useCallback } from 'react'
import { Upload, Loader2, Download, AlertCircle, Sparkles, Image as ImageIcon, Wand2 } from 'lucide-react'

interface GeneratedImage {
  prompt: string
  image_base64: string
  image_url?: string
  index: number
  input_image?: string
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

export default function VisualGodApp() {
  const [files, setFiles] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ProcessedResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [generateImages, setGenerateImages] = useState(true)

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
    const link = document.createElement('a')
    link.href = `data:image/jpeg;base64,${image.image_base64}`
    link.download = `visual-god-enhanced-${image.index + 1}.jpg`
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

      // Call API with new generate_images parameter
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images,
          userId: null,
          generate_images: generateImages
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
                      <span className="text-sm font-normal bg-white/20 px-2 py-1 rounded-full">GPT-Image-1</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {result.generated_images.map((image, i) => (
                        <div key={i} className="bg-white/5 rounded-lg overflow-hidden">
                          <div className="aspect-square relative group">
                            <img
                              src={`data:image/jpeg;base64,${image.image_base64}`}
                              alt={`AI-enhanced image ${i + 1}`}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            {image.input_image && (
                              <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                From: {image.input_image}
                              </div>
                            )}
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
                              Download Enhanced
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-white/60 text-sm">
                        ✨ Images enhanced using GPT-Image-1 from your uploaded content
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
          <p className="text-white/80 text-center mb-8">AI-Powered Content Creator with Image Enhancement</p>

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

          {/* Process Button */}
          {files.length > 0 && (
            <>
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
                    {generateImages ? 'Analyze & Enhance Images' : 'Analyze Images Only'}
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
              <li>🤖 AI analyzes and classifies your images</li>
              <li>✨ Get professional marketing prompts instantly</li>
              <li>🎨 <strong>NEW:</strong> Generate enhanced marketing images using GPT-Image-1</li>
              <li>💾 Download your enhanced images for immediate use</li>
            </ul>
            
            <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-white/10">
              <p className="text-white/90 text-xs">
                <strong>GPT-Image-1</strong> uses your uploaded images as a foundation to create 
                professional marketing visuals with enhanced lighting, composition, and style.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}