'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Clock, ImageIcon, Sparkles, Eye, X } from 'lucide-react'
import Link from 'next/link'

interface HistoryContentProps {
  sessions: any[]
}

export function HistoryContent({ sessions }: HistoryContentProps) {
  const router = useRouter()
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [viewingImage, setViewingImage] = useState<any>(null)

  const downloadImage = (imageData: any) => {
    if (imageData.metadata?.base64) {
      const link = document.createElement('a')
      link.href = `data:image/jpeg;base64,${imageData.metadata.base64}`
      link.download = imageData.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
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
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {session.generated_images.map((image: any) => (
                          <div key={image.id} className="bg-white/5 rounded-lg overflow-hidden group">
                            <div className="aspect-square relative">
                              {image.metadata?.base64 ? (
                                <>
                                  <img
                                    src={`data:image/jpeg;base64,${image.metadata.base64}`}
                                    alt={image.filename}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setViewingImage(image)
                                      }}
                                      className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
                                    >
                                      <Eye className="w-5 h-5 text-white" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        downloadImage(image)
                                      }}
                                      className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
                                    >
                                      <Download className="w-5 h-5 text-white" />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                  <ImageIcon className="w-12 h-12 text-white/40" />
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <p className="text-white/80 text-sm line-clamp-2">
                                {image.prompt_text}
                              </p>
                              <div className="flex items-center justify-between mt-2 text-white/60 text-xs">
                                <span>{image.platform} • {image.size}</span>
                              </div>
                            </div>
                          </div>
                        ))}
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
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute -top-12 right-0 bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <img
              src={`data:image/jpeg;base64,${viewingImage.metadata.base64}`}
              alt={viewingImage.filename}
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
            />
            <div className="mt-4 flex items-center justify-between">
              <p className="text-white/80">{viewingImage.prompt_text}</p>
              <button
                onClick={() => downloadImage(viewingImage)}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}