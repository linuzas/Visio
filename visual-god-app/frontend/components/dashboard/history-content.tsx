// File: visual-god-app/frontend/components/dashboard/history-content.tsx

'use client'

import { useState } from 'react'
import { Download, Clock, ImageIcon, Eye, X, Calendar, Package, Sparkles } from 'lucide-react'
import { PageNavbar } from '@/components/navigation/navbar'
import Link from 'next/link'

interface GeneratedImage {
  id: string
  filename: string
  prompt_text: string
  platform: string
  size: string
  created_at: string
  metadata?: {
    base64?: string
    product_name?: string
    prompt_type?: string
    public_url?: string
    storage_path?: string
    storage_type?: string
  }
}

interface GenerationSession {
  id: string
  session_name: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  credits_used: number
  created_at: string
  updated_at: string
  metadata?: {
    platform?: string
    product_count?: number
  }
  generated_images?: GeneratedImage[]
}

interface HistoryContentProps {
  sessions: GenerationSession[]
  user: any
}

export function HistoryContent({ sessions, user }: HistoryContentProps) {
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [viewingImage, setViewingImage] = useState<GeneratedImage | null>(null)
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set())

  const downloadImage = (imageData: GeneratedImage) => {
    try {
      let imageUrl = ''
      let filename = imageData.filename || 'image.jpg'

      // Try different image sources in order of preference
      if (imageData.metadata?.base64) {
        // Use base64 from metadata
        imageUrl = `data:image/jpeg;base64,${imageData.metadata.base64}`
      } else if (imageData.metadata?.public_url) {
        // Use public URL if available
        imageUrl = imageData.metadata.public_url
      } else {
        console.error('No image data available for download')
        return
      }

      // Create download link
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log(`Downloaded: ${filename}`)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download image. Please try again.')
    }
  }

  const getImageSrc = (image: GeneratedImage): string | null => {
    // Return null if we know this image has load errors
    if (imageLoadErrors.has(image.id)) {
      return null
    }

    // Try different image sources
    if (image.metadata?.base64) {
      return `data:image/jpeg;base64,${image.metadata.base64}`
    } else if (image.metadata?.public_url) {
      return image.metadata.public_url
    }
    
    return null
  }

  const handleImageError = (imageId: string) => {
    setImageLoadErrors(prev => new Set([...prev, imageId]))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/40'
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-500/40'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/40'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTotalImages = (sessions: GenerationSession[]) => {
    return sessions.reduce((total, session) => {
      return total + (session.generated_images?.length || 0)
    }, 0)
  }

  const getTotalCreditsUsed = (sessions: GenerationSession[]) => {
    return sessions.reduce((total, session) => total + session.credits_used, 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-8">
      <div className="max-w-6xl mx-auto">
        <PageNavbar 
          user={user}
          title="Generation History"
          subtitle="View and download your previous creations"
        />
        
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
          {/* Stats Summary */}
          {sessions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 rounded-xl p-6 text-center hover:bg-white/15 transition">
                <Sparkles className="w-8 h-8 text-white mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{sessions.length}</p>
                <p className="text-white/60 text-sm">Total Sessions</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6 text-center hover:bg-white/15 transition">
                <ImageIcon className="w-8 h-8 text-white mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{getTotalImages(sessions)}</p>
                <p className="text-white/60 text-sm">Images Generated</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6 text-center hover:bg-white/15 transition">
                <Package className="w-8 h-8 text-white mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{getTotalCreditsUsed(sessions)}</p>
                <p className="text-white/60 text-sm">Credits Used</p>
              </div>
            </div>
          )}

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No generation history yet</h3>
              <p className="text-white/60 mb-6">
                Start creating amazing content to see your history here
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
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-200"
                >
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => setSelectedSession(selectedSession === session.id ? null : session.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-2">
                          {session.session_name || `Session ${formatDate(session.created_at)}`}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(session.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            {session.credits_used} credit{session.credits_used !== 1 ? 's' : ''}
                          </div>
                          {session.metadata?.platform && (
                            <div className="flex items-center gap-1">
                              <ImageIcon className="w-4 h-4" />
                              {session.metadata.platform}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                        <div className="text-right">
                          <p className="text-white font-medium">
                            {session.generated_images?.length || 0}
                          </p>
                          <p className="text-white/60 text-xs">images</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Session Content */}
                  {selectedSession === session.id && session.generated_images && session.generated_images.length > 0 && (
                    <div className="px-6 pb-6 border-t border-white/10">
                      <div className="pt-6">
                        <h4 className="text-white font-medium mb-4">Generated Images</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {session.generated_images.map((image) => {
                            const imageSrc = getImageSrc(image)
                            
                            return (
                              <div key={image.id} className="bg-white/5 rounded-lg overflow-hidden group hover:bg-white/10 transition">
                                <div className="aspect-square relative">
                                  {imageSrc ? (
                                    <>
                                      <img
                                        src={imageSrc}
                                        alt={image.filename}
                                        className="w-full h-full object-cover"
                                        onError={() => handleImageError(image.id)}
                                      />
                                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setViewingImage(image)
                                          }}
                                          className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
                                          title="View full size"
                                        >
                                          <Eye className="w-5 h-5 text-white" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            downloadImage(image)
                                          }}
                                          className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
                                          title="Download image"
                                        >
                                          <Download className="w-5 h-5 text-white" />
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-full h-full bg-white/10 flex flex-col items-center justify-center">
                                      <ImageIcon className="w-12 h-12 text-white/40 mb-2" />
                                      <p className="text-white/40 text-xs text-center">Image not available</p>
                                    </div>
                                  )}
                                </div>
                                <div className="p-3">
                                  <p className="text-white/80 text-sm line-clamp-2 mb-2">
                                    {image.prompt_text || 'No prompt available'}
                                  </p>
                                  <div className="flex items-center justify-between text-white/60 text-xs">
                                    <span>{image.platform} • {image.size}</span>
                                    {image.metadata?.product_name && (
                                      <span className="bg-white/10 px-2 py-1 rounded">
                                        {image.metadata.product_name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute -top-12 right-0 bg-white/20 hover:bg-white/30 p-2 rounded-lg transition z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden">
              {getImageSrc(viewingImage) ? (
                <img
                  src={getImageSrc(viewingImage)!}
                  alt={viewingImage.filename}
                  className="w-full max-h-[70vh] object-contain"
                />
              ) : (
                <div className="w-full h-64 bg-white/10 flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 text-white/40 mx-auto mb-2" />
                    <p className="text-white/60">Image not available</p>
                  </div>
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-2">{viewingImage.filename}</h3>
                    <p className="text-white/80 text-sm mb-2">
                      {viewingImage.prompt_text || 'No prompt available'}
                    </p>
                    <div className="flex items-center gap-4 text-white/60 text-xs">
                      <span>{viewingImage.platform} • {viewingImage.size}</span>
                      <span>{formatDate(viewingImage.created_at)}</span>
                      {viewingImage.metadata?.product_name && (
                        <span className="bg-white/10 px-2 py-1 rounded">
                          {viewingImage.metadata.product_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => downloadImage(viewingImage)}
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