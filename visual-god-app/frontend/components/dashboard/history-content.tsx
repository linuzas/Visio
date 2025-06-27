'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Clock, ImageIcon, Sparkles, Home, Eye } from 'lucide-react'
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
    public_url?: string
    storage_path?: string
  }
}

interface Session {
  id: string
  session_name: string
  status: string
  credits_used: number
  created_at: string
  generated_images: GeneratedImage[]
}

interface HistoryContentProps {
  sessions: Session[]
}

export function HistoryContent({ sessions }: HistoryContentProps) {
  const router = useRouter()
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)

  const getImageUrl = (image: GeneratedImage) => {
    // Try storage URL first, then fall back to base64
    if (image.metadata?.public_url) {
      return image.metadata.public_url
    } else if (image.metadata?.base64) {
      return `data:image/jpeg;base64,${image.metadata.base64}`
    }
    return null
  }

  const downloadImage = async (image: GeneratedImage) => {
    try {
      const imageUrl = getImageUrl(image)
      if (!imageUrl) {
        console.error('No image URL available')
        return
      }

      // If it's a storage URL, fetch it
      if (image.metadata?.public_url) {
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = image.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        // If it's base64, download directly
        const link = document.createElement('a')
        link.href = imageUrl
        link.download = image.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const viewImage = (image: GeneratedImage) => {
    setSelectedImage(image)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Clock className="w-8 h-8" />
              Generation History
            </h1>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition"
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <p className="text-white/60 text-lg">No generation history yet</p>
              <Link
                href="/dashboard"
                className="inline-block mt-4 bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-xl transition"
              >
                Create Your First Content
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition"
                >
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setSelectedSession(selectedSession === session.id ? null : session.id)}
                  >
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {session.session_name || 'Untitled Session'}
                      </h3>
                      <p className="text-white/60 text-sm">
                        {new Date(session.created_at).toLocaleString()} • 
                        {session.credits_used} credit{session.credits_used !== 1 ? 's' : ''} used
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        session.status === 'completed' 
                          ? 'bg-green-500/20 text-green-300'
                          : session.status === 'processing'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {session.status}
                      </span>
                      <span className="text-white/60">
                        {session.generated_images?.length || 0} images
                      </span>
                    </div>
                  </div>

                  {selectedSession === session.id && session.generated_images?.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Generated Images ({session.generated_images.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {session.generated_images.map((image: GeneratedImage) => {
                          const imageUrl = getImageUrl(image)
                          
                          return (
                            <div key={image.id} className="bg-white/5 rounded-lg p-4">
                              {imageUrl ? (
                                <div className="space-y-3">
                                  <div className="relative group">
                                    <img
                                      src={imageUrl}
                                      alt={image.filename}
                                      className="w-full h-48 object-cover rounded-lg"
                                      onError={(e) => {
                                        console.error('Image load error:', e)
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => viewImage(image)}
                                        className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => downloadImage(image)}
                                        className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
                                      >
                                        <Download className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-white/80 text-sm mb-2 line-clamp-2">
                                      {image.prompt_text}
                                    </p>
                                    <div className="flex items-center justify-between text-white/60 text-xs">
                                      <span>{image.platform} • {image.size}</span>
                                      <span>{new Date(image.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {image.metadata?.public_url && (
                                      <p className="text-green-300 text-xs mt-1">Stored in cloud</p>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="w-full h-48 bg-white/10 rounded-lg flex items-center justify-center">
                                    <ImageIcon className="w-12 h-12 text-white/40" />
                                  </div>
                                  <div>
                                    <p className="text-white/80 text-sm mb-2 line-clamp-2">
                                      {image.prompt_text}
                                    </p>
                                    <div className="flex items-center justify-between text-white/60 text-xs">
                                      <span>{image.platform} • {image.size}</span>
                                      <span>{new Date(image.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-white/50 text-xs mt-1">Image not available</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Generated Image</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-white/60 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            {getImageUrl(selectedImage) ? (
              <div className="space-y-4">
                <img
                  src={getImageUrl(selectedImage)!}
                  alt={selectedImage.filename}
                  className="w-full max-h-[60vh] object-contain rounded-lg"
                />
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/80 text-sm mb-2">
                    <strong>Prompt:</strong> {selectedImage.prompt_text}
                  </p>
                  <div className="flex items-center justify-between text-white/60 text-sm">
                    <span>{selectedImage.platform} • {selectedImage.size}</span>
                    <span>{new Date(selectedImage.created_at).toLocaleString()}</span>
                  </div>
                  {selectedImage.metadata?.public_url && (
                    <p className="text-green-300 text-xs mt-2">✅ Stored in Supabase Storage</p>
                  )}
                </div>
                <button
                  onClick={() => downloadImage(selectedImage)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Image
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <p className="text-white/60">Image data not available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}