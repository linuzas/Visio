// File: visual-god-app/frontend/components/dashboard/history-content.tsx
// FIXED VERSION - Better image loading and mobile optimization

'use client'

import { useState, useEffect } from 'react'
import { Download, ImageIcon, Calendar, Sparkles, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface GeneratedImage {
  id: string
  filename: string
  created_at: string
  metadata?: {
    base64?: string
    product_name?: string
    prompt_type?: string
    public_url?: string
  }
  platform: string
  size: string
  file_path?: string
}

interface OptimizedSession {
  id: string
  created_at: string
  credits_used: number
  image_count: number
  platform?: string
}

interface HistoryContentProps {
  sessions: OptimizedSession[]
  images: GeneratedImage[]
  user: any
}

export function HistoryContent({ sessions, images: initialImages, user }: HistoryContentProps) {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)
  const [images, setImages] = useState<GeneratedImage[]>(initialImages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  // Enhanced image loading with fallback to Supabase storage
  const loadImages = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Get fresh data from database with full metadata
      const { data: freshImages, error: dbError } = await supabase
        .from('generated_images')
        .select(`
          id,
          filename,
          created_at,
          platform,
          size,
          file_path,
          metadata
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50) // Limit for performance

      if (dbError) throw dbError

      // For each image, try to get the public URL if file_path exists
      const imagesWithUrls = await Promise.all(
        (freshImages || []).map(async (img) => {
          let enhancedImg = { ...img }
          
          // Try to get public URL from storage if file_path exists
          if (img.file_path) {
            try {
              const { data: urlData } = supabase.storage
                .from('generated-images')
                .getPublicUrl(img.file_path)
              
              if (urlData?.publicUrl) {
                enhancedImg.metadata = {
                  ...img.metadata,
                  public_url: urlData.publicUrl
                }
              }
            } catch (urlError) {
              console.warn(`Failed to get URL for ${img.file_path}:`, urlError)
            }
          }
          
          return enhancedImg
        })
      )

      setImages(imagesWithUrls)
      console.log(`✅ Loaded ${imagesWithUrls.length} images with enhanced URLs`)
      
    } catch (err: any) {
      console.error('❌ Failed to load images:', err)
      setError('Failed to load recent images. Using cached data.')
      // Keep existing images as fallback
    } finally {
      setLoading(false)
    }
  }

  // Load images on component mount
  useEffect(() => {
    if (user?.id) {
      loadImages()
    }
  }, [user?.id])

  const downloadImage = (image: GeneratedImage) => {
    try {
      let imageUrl = ''
      let filename = image.filename || 'visual-god-image.jpg'

      // Try different image sources in order of preference
      if (image.metadata?.public_url) {
        // Try public URL first
        imageUrl = image.metadata.public_url
      } else if (image.metadata?.base64) {
        // Fallback to base64
        imageUrl = `data:image/jpeg;base64,${image.metadata.base64}`
      } else {
        console.error('No image data available for download')
        alert('Image not available for download. Please try refreshing the page.')
        return
      }

      // Create download link
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = filename
      link.target = '_blank' // Open in new tab for URLs
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log(`✅ Downloaded: ${filename}`)
    } catch (error) {
      console.error('❌ Download failed:', error)
      alert('Failed to download image. Please try again.')
    }
  }

  const getImageSrc = (image: GeneratedImage): string | null => {
    // Try public URL first (most reliable)
    if (image.metadata?.public_url) {
      return image.metadata.public_url
    }
    // Fallback to base64 if available
    if (image.metadata?.base64) {
      return `data:image/jpeg;base64,${image.metadata.base64}`
    }
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAspectRatio = (platform: string) => {
    switch (platform) {
      case 'instagram': return 'aspect-[9/16]'
      case 'facebook': return 'aspect-square'
      case 'youtube': return 'aspect-[16/9]'
      default: return 'aspect-square'
    }
  }

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'instagram': return 'Instagram'
      case 'facebook': return 'Facebook'
      case 'youtube': return 'YouTube'
      default: return platform
    }
  }

  // Group images by date for better organization
  const imagesByDate = images.reduce((acc, image) => {
    const date = new Date(image.created_at).toDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(image)
    return acc
  }, {} as Record<string, GeneratedImage[]>)

  const totalImages = images.length
  const totalCreditsUsed = sessions.reduce((sum, session) => sum + session.credits_used, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Simple Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 md:p-6 mb-8 shadow-2xl border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Your Gallery</h1>
                <p className="text-white/60 text-sm">{totalImages} images created</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadImages}
                disabled={loading}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl transition text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <div className="text-white/60 text-sm flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                <span>{totalCreditsUsed} credits used</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-2xl">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-orange-500/20 border border-orange-400/30 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-300" />
              <p className="text-orange-200">{error}</p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 rounded-xl p-4 text-center hover:bg-white/15 transition">
              <p className="text-2xl font-bold text-white">{totalImages}</p>
              <p className="text-white/60 text-sm">Total Images</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center hover:bg-white/15 transition">
              <p className="text-2xl font-bold text-white">{sessions.length}</p>
              <p className="text-white/60 text-sm">Sessions</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center hover:bg-white/15 transition">
              <p className="text-2xl font-bold text-white">{totalCreditsUsed}</p>
              <p className="text-white/60 text-sm">Credits Used</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center hover:bg-white/15 transition">
              <p className="text-2xl font-bold text-white">
                {Object.keys(imagesByDate).length}
              </p>
              <p className="text-white/60 text-sm">Active Days</p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 text-white/60 mx-auto mb-4 animate-spin" />
              <p className="text-white/60">Loading recent images...</p>
            </div>
          )}

          {/* Image Gallery */}
          {!loading && totalImages === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No images yet</h3>
              <p className="text-white/60 mb-6">
                Start creating amazing content to see your gallery here
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-medium transition transform hover:scale-105"
              >
                <Sparkles className="w-5 h-5" />
                Create Your First Content
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(imagesByDate)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, dayImages]) => (
                  <div key={date}>
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                      <span className="text-white/60 text-sm">({dayImages.length} images)</span>
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {dayImages.map((image) => {
                        const imageSrc = getImageSrc(image)
                        
                        return (
                          <div
                            key={image.id}
                            className="bg-white/5 rounded-lg overflow-hidden group hover:bg-white/10 transition-all duration-200 transform hover:scale-105 cursor-pointer"
                            onClick={() => setSelectedImage(image)}
                          >
                            <div className={`relative ${getAspectRatio(image.platform)}`}>
                              {imageSrc ? (
                                <>
                                  <img
                                    src={imageSrc}
                                    alt={image.filename}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                      console.error(`Failed to load image: ${image.filename}`)
                                      e.currentTarget.style.display = 'none'
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                    }}
                                  />
                                  {/* Fallback placeholder */}
                                  <div className="hidden absolute inset-0 bg-white/10 flex items-center justify-center">
                                    <div className="text-center">
                                      <ImageIcon className="w-8 h-8 text-white/40 mx-auto mb-2" />
                                      <p className="text-white/60 text-xs">Image unavailable</p>
                                    </div>
                                  </div>
                                  
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="text-center">
                                      <p className="text-white text-xs mb-1">
                                        {getPlatformLabel(image.platform)}
                                      </p>
                                      <p className="text-white/80 text-xs">
                                        {formatDate(image.created_at)}
                                      </p>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                  <div className="text-center">
                                    <ImageIcon className="w-8 h-8 text-white/40 mx-auto mb-2" />
                                    <p className="text-white/60 text-xs">No preview</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Image info */}
                            <div className="p-2">
                              <div className="flex items-center justify-between">
                                <span className="text-white/80 text-xs truncate flex-1">
                                  {image.metadata?.product_name || 'Product'}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    downloadImage(image)
                                  }}
                                  className="text-white/60 hover:text-white transition-colors p-1"
                                  title="Download"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-white/50 text-xs">
                                {image.metadata?.prompt_type?.replace('style_', 'Style ') || 'Generated'}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Image Viewer Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 bg-white/20 hover:bg-white/30 p-2 rounded-lg transition z-10 text-white"
            >
              ✕
            </button>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden">
              {getImageSrc(selectedImage) ? (
                <img
                  src={getImageSrc(selectedImage)!}
                  alt={selectedImage.filename}
                  className="w-full max-h-[70vh] object-contain"
                />
              ) : (
                <div className="w-full h-64 bg-white/10 flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60">Image not available</p>
                  </div>
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-2">{selectedImage.filename}</h3>
                    <div className="flex items-center gap-4 text-white/60 text-sm">
                      <span>{getPlatformLabel(selectedImage.platform)} • {selectedImage.size}</span>
                      <span>{formatDate(selectedImage.created_at)}</span>
                      {selectedImage.metadata?.product_name && (
                        <span className="bg-white/10 px-2 py-1 rounded">
                          {selectedImage.metadata.product_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => downloadImage(selectedImage)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 ml-4"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}