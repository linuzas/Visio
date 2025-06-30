// File: visual-god-app/frontend/app/dashboard/dashboard-content.tsx
// FIXED VERSION - Better responsive navigation and mobile optimization

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, Loader2, Download, AlertCircle, Sparkles, ImageIcon, Wand2, Instagram, Facebook, MonitorPlay, CreditCard, BarChart3, Clock, CheckCircle, X, Package, User, Settings, StopCircle, Home, History, ArrowLeft, Eye, EyeOff, RefreshCw, Trash2, Menu, LogOut } from 'lucide-react'
import Link from 'next/link'

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
    credits: 3
  },
  facebook: {
    label: 'Facebook Photo Ad',
    size: '1080x1080',
    icon: Facebook,
    description: 'Square format (1:1) for Facebook feed',
    aspect: 'Square',
    credits: 3
  },
  youtube: {
    label: 'YouTube Banner',
    size: '2560x1440',
    icon: MonitorPlay,
    description: 'Widescreen format (16:9) for all devices',
    aspect: 'Landscape',
    credits: 3
  }
}

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
  const [selectedSize, setSelectedSize] = useState<keyof typeof IMAGE_SIZES>('instagram')
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingStep, setProcessingStep] = useState('')
  const [cancelRequested, setCancelRequested] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [validating, setValidating] = useState(false)
  const [canProceed, setCanProceed] = useState(false)
  const [validationProgress, setValidationProgress] = useState(0)
  const [showValidationDetails, setShowValidationDetails] = useState(false)
  const [hasValidated, setHasValidated] = useState(false)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const creditsRemaining = stats?.credits_remaining || 0
  const validProducts = validationResults.filter(r => r.is_product && r.confidence > 0.7)
  const rejectedImages = validationResults.filter(r => !(r.is_product && r.confidence > 0.7))
  const requiredCredits = validProducts.length * 3

  // Close mobile menu when route changes or when clicking outside
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [])

  // Close mobile menu on window resize to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setMobileMenuOpen(false)
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
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
    
    const newFiles = [...files, ...droppedFiles]
    setFiles(newFiles)
    
    if (newFiles.length > 0) {
      validateImages(newFiles)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(
        file => file.type.startsWith('image/')
      )
      
      const newFiles = [...files, ...selectedFiles]
      setFiles(newFiles)
      
      if (newFiles.length > 0) {
        validateImages(newFiles)
      }
    }
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    if (newFiles.length > 0) {
      validateImages(newFiles)
    } else {
      setValidationResults([])
      setCanProceed(false)
      setShowValidationDetails(false)
      setHasValidated(false)
      setValidationProgress(0)
    }
  }

  // Validation function
  const validateImages = async (filesToValidate: File[] = files) => {
    if (filesToValidate.length === 0) {
      setValidationResults([])
      setCanProceed(false)
      setShowValidationDetails(false)
      setHasValidated(false)
      setValidationProgress(0)
      return
    }

    setValidating(true)
    setShowValidationDetails(true)
    setHasValidated(false)
    setValidationProgress(0)

    try {
      console.log(`🔍 Starting validation for ${filesToValidate.length} images...`)
      
      const imagePromises = filesToValidate.map((file, index) => {
        return new Promise<{ base64: string; filename: string }>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const base64 = e.target?.result as string
            setValidationProgress(((index + 1) / filesToValidate.length) * 50)
            resolve({
              base64: base64.split(',')[1],
              filename: file.name
            })
          }
          reader.readAsDataURL(file)
        })
      })

      const images = await Promise.all(imagePromises)
      
      setValidationProgress(60)

      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ images })
      })

      setValidationProgress(90)

      const data = await response.json()

      if (data.success) {
        setValidationResults(data.validation_results || [])
        setCanProceed(data.can_proceed || false)
        setValidationProgress(100)
        setHasValidated(true)
        
        console.log(`✅ Validation complete: ${data.validation_results?.length || 0} results`)
      } else {
        setValidationResults([])
        setCanProceed(false)
        setValidationProgress(100)
        setHasValidated(true)
        console.error('❌ Validation failed:', data.error)
      }

    } catch (error) {
      console.error('❌ Validation error:', error)
      setValidationResults([])
      setCanProceed(false)
      setValidationProgress(100)
      setHasValidated(true)
    } finally {
      setTimeout(() => {
        setValidating(false)
      }, 800)
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

    if (creditsRemaining < requiredCredits) {
      alert(`Not enough credits. You need ${requiredCredits} credits but only have ${creditsRemaining}.`)
      return
    }

    setProcessing(true)
    setResult(null)
    setUploadProgress(0)
    setCancelRequested(false)
    
    abortControllerRef.current = new AbortController()
    const stopMessages = startLoadingMessages()

    try {
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
      
      if (cancelRequested) return

      setUploadProgress(40)

      setProcessingStep('Processing with AI...')
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images,
          userId: profile.id,
          generate_images: true,
          image_size: selectedSize,
          sessionId: `session_${Date.now()}`
        }),
        signal: abortControllerRef.current.signal
      })

      setUploadProgress(70)

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('Image files are too large. Please use smaller images (under 4MB each).')
        }
        if (response.status === 500) {
          throw new Error('Server error occurred. This might be temporary - please try again in a moment.')
        }
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      
      if (cancelRequested) return
      
      setUploadProgress(100)
      setResult(data)
      router.refresh()

    } catch (error: any) {
      if (error.name === 'AbortError' || cancelRequested) {
        return
      } else {
        console.error('Processing error:', error)
        setResult({
          success: false,
          error: error.message || 'An unexpected error occurred'
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
    setShowValidationDetails(false)
    setHasValidated(false)
    setValidationProgress(0)
    setCancelRequested(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // FIXED: Responsive Dashboard Navigation Component
  const DashboardNav = () => (
    <>
      <nav className="bg-white/10 backdrop-blur-md rounded-2xl lg:rounded-3xl p-4 lg:p-6 mb-6 lg:mb-8 shadow-2xl border border-white/20 relative z-50">
        <div className="flex items-center justify-between">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 lg:gap-3 hover:scale-105 transition-transform flex-shrink-0"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Sparkles className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              <span className="text-lg lg:text-2xl font-bold text-white hidden sm:block">Visual God</span>
              <span className="text-lg font-bold text-white sm:hidden">VG</span>
            </Link>
            
            <div className="hidden md:block w-px h-6 lg:h-8 bg-white/20" />
            
            <div className="hidden md:block min-w-0 flex-1">
              <h1 className="text-lg lg:text-xl font-bold text-white truncate">
                Welcome back, {profile?.full_name || profile?.username || 'Creator'}!
              </h1>
              <p className="text-white/60 text-sm lg:text-base truncate">Create amazing content with AI</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            <Link
              href="/dashboard/preferences"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl transition-all duration-200 transform hover:scale-105 text-sm lg:text-base"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden lg:inline">Preferences</span>
            </Link>
            <Link
              href="/dashboard/history"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl transition-all duration-200 transform hover:scale-105 text-sm lg:text-base"
            >
              <History className="w-4 h-4" />
              <span className="hidden lg:inline">History</span>
            </Link>
            <Link
              href="/dashboard/stats"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl transition-all duration-200 transform hover:scale-105 text-sm lg:text-base"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden lg:inline">Stats</span>
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl transition-all duration-200 transform hover:scale-105 text-sm lg:text-base"
            >
              <User className="w-4 h-4" />
              <span className="hidden lg:inline">Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl transition-all duration-200 transform hover:scale-105 text-sm lg:text-base"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2 hover:bg-white/20 rounded-lg transition flex-shrink-0"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Title (shown when desktop title is hidden) */}
        <div className="md:hidden mt-4 pt-4 border-t border-white/20">
          <h1 className="text-lg font-bold text-white">
            Welcome back, {profile?.full_name?.split(' ')[0] || profile?.username || 'Creator'}!
          </h1>
          <p className="text-white/60 text-sm">Create amazing content with AI</p>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Slide-out */}
      <div className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 transform transition-transform duration-300 z-50 md:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-white" />
              <span className="text-xl font-bold text-white">Visual God</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-white p-2 hover:bg-white/20 rounded-lg transition"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="mb-8 p-4 bg-white/10 rounded-xl">
            <h3 className="text-white font-semibold">
              {profile?.full_name || profile?.username || 'Creator'}
            </h3>
            <p className="text-white/60 text-sm">{profile?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-white/60" />
              <span className="text-white/80 text-sm">
                {creditsRemaining} credits remaining
              </span>
            </div>
          </div>

          {/* Mobile Menu Items */}
          <div className="space-y-2">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center gap-3 bg-white/20 text-white px-4 py-3 rounded-xl transition-all duration-200"
            >
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/history"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-all duration-200"
            >
              <History className="w-5 h-5" />
              History
            </Link>
            <Link
              href="/dashboard/stats"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-all duration-200"
            >
              <BarChart3 className="w-5 h-5" />
              Stats
            </Link>
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-all duration-200"
            >
              <User className="w-5 h-5" />
              Profile
            </Link>
            <Link
              href="/dashboard/preferences"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-all duration-200"
            >
              <Settings className="w-5 h-5" />
              Preferences
            </Link>
            
            <div className="pt-4 border-t border-white/20">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-3 rounded-xl transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  // File list component
  const FileList = () => {
    if (files.length === 0) return null

    return (
      <div className="mt-6 space-y-3">
        <h3 className="text-white font-medium text-sm">Uploaded Files ({files.length})</h3>
        {files.map((file, i) => (
          <div 
            key={`${file.name}-${i}`} 
            className="bg-white/10 rounded-lg p-4 flex items-center justify-between group hover:bg-white/15 transition-all duration-200"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <ImageIcon className="w-5 h-5 text-white/60 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-white text-sm truncate block">{file.name}</span>
                <span className="text-white/40 text-xs">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
            
            <button
              onClick={() => removeFile(i)}
              onTouchEnd={(e) => {
                e.preventDefault()
                removeFile(i)
              }}
              className="bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-200 p-2 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95 ml-3 flex-shrink-0 touch-manipulation"
              style={{ touchAction: 'manipulation' }}
              aria-label={`Remove ${file.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    )
  }

  // Validation results component
  const ValidationResults = () => {
    if (!showValidationDetails && !validating) return null

    return (
      <div className="mt-6 bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Image Analysis
            {validating && (
              <span className="text-sm font-normal text-white/60">
                ({validationProgress}%)
              </span>
            )}
          </h3>
          {hasValidated && (
            <button
              onClick={() => setShowValidationDetails(!showValidationDetails)}
              className="text-white/60 hover:text-white transition-colors p-1 rounded"
              title={showValidationDetails ? 'Hide details' : 'Show details'}
            >
              {showValidationDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>

        {validating ? (
          <div className="space-y-4">
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${validationProgress}%` }}
              />
            </div>
            <div className="text-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto mb-2" />
              <p className="text-white/80 text-sm">
                {validationProgress < 50 ? 'Converting images...' : 
                 validationProgress < 90 ? 'Analyzing with AI...' : 'Finishing up...'}
              </p>
            </div>
          </div>
        ) : hasValidated && showValidationDetails ? (
          <div className="space-y-4">
            {validProducts.length > 0 && (
              <div>
                <h4 className="text-blue-300 font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Valid Products ({validProducts.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {validProducts.map((result, i) => (
                    <div key={i} className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 hover:bg-blue-500/15 transition-colors">
                      <p className="text-blue-200 font-medium">{result.product_name || 'Product'}</p>
                      <p className="text-blue-300/80 text-sm">{result.description}</p>
                      <p className="text-blue-300/60 text-xs">Confidence: {(result.confidence * 100).toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rejectedImages.length > 0 && (
              <div>
                <h4 className="text-orange-300 font-medium mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Rejected Images ({rejectedImages.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rejectedImages.map((result, i) => (
                    <div key={i} className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 hover:bg-orange-500/15 transition-colors">
                      <p className="text-orange-200 font-medium">{result.category}</p>
                      <p className="text-orange-300/80 text-sm">{result.description}</p>
                      {result.rejection_reason && (
                        <p className="text-orange-300/60 text-xs">{result.rejection_reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              {canProceed ? (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <p className="text-blue-300">
                    Ready to proceed! Found {validProducts.length} valid product{validProducts.length !== 1 ? 's' : ''}.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <p className="text-orange-300">
                    Cannot proceed. Please upload at least one clear product image.
                  </p>
                  <button
                    onClick={() => validateImages()}
                    className="ml-auto bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : hasValidated ? (
          <div className="text-center py-2">
            <p className="text-white/60 text-sm">
              {canProceed ? 
                `✅ Analysis complete - ${validProducts.length} valid product${validProducts.length !== 1 ? 's' : ''} found` :
                `⚠️ Analysis complete - No valid products found`
              }
            </p>
          </div>
        ) : null}
      </div>
    )
  }

  // If result exists, show results page
  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <DashboardNav />
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
              <h1 className="text-2xl lg:text-4xl font-bold text-white flex items-center gap-3">
                <Sparkles className="w-8 h-8 lg:w-10 lg:h-10" />
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
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4 animate-pulse">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white mb-2">Processing Complete!</h2>
                  <p className="text-white/80">{result.message}</p>
                </div>

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

                {result.generated_images && result.generated_images.length > 0 && (
                  <div className="bg-white/10 rounded-xl p-6">
                    <h2 className="text-xl lg:text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                      <Wand2 className="w-6 h-6 lg:w-8 lg:h-8" />
                      AI-Enhanced Images ({result.generated_images.length})
                      <span className="text-sm font-normal bg-white/20 px-2 py-1 rounded-full">
                        {IMAGE_SIZES[selectedSize].size}
                      </span>
                    </h2>

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
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <DashboardNav />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-xs lg:text-sm">Plan</span>
              <CreditCard className="w-4 h-4 lg:w-5 lg:h-5 text-white/40" />
            </div>
            <p className="text-lg lg:text-2xl font-bold text-white capitalize">{profile.plan}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-xs lg:text-sm">Credits</span>
              <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-white/40" />
            </div>
            <p className="text-lg lg:text-2xl font-bold text-white">{creditsRemaining}/{profile.credits_total}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-xs lg:text-sm">Total Images</span>
              <ImageIcon className="w-4 h-4 lg:w-5 lg:h-5 text-white/40" />
            </div>
            <p className="text-lg lg:text-2xl font-bold text-white">{stats?.total_images_generated || 0}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-xs lg:text-sm">Sessions</span>
              <Wand2 className="w-4 h-4 lg:w-5 lg:h-5 text-white/40" />
            </div>
            <p className="text-lg lg:text-2xl font-bold text-white">{stats?.total_sessions || 0}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-2xl">
          <h2 className="text-xl lg:text-2xl font-bold text-white mb-6 text-center">Create New Content</h2>

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
            className={`border-2 border-dashed rounded-2xl p-6 lg:p-8 text-center transition-all duration-200 ${
              dragActive ? 'border-white bg-white/10 scale-105' : 'border-white/30 hover:border-white/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 lg:w-16 lg:h-16 text-white/60 mx-auto mb-4" />
            <p className="text-white text-base lg:text-lg mb-2">Drag & drop product images here</p>
            <p className="text-white/60 mb-4">or</p>
            <label className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 lg:px-6 rounded-xl cursor-pointer transition-all duration-200 inline-block transform hover:scale-105">
              Browse Files
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <p className="text-white/40 text-xs lg:text-sm mt-4">
              Upload product images only (no people/avatars) • JPEG, PNG, WEBP • Max 4MB each
            </p>
          </div>

          {/* File List */}
          <FileList />

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

              {/* AI Enhancement Info */}
              <div className="mt-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-white/20">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Enhancement Included
                </h4>
                <ul className="text-white/80 text-sm space-y-1">
                  <li>• Each valid product generates 3 unique marketing styles automatically</li>
                  <li>• {validProducts.length} valid product{validProducts.length !== 1 ? 's' : ''} × 3 styles = {requiredCredits} credits needed</li>
                  <li>• You have {creditsRemaining} credits available</li>
                  <li>• Professional AI enhancement with GPT-Image-1 model</li>
                </ul>
              </div>

              {/* Credits Warning */}
              {creditsRemaining < requiredCredits && (
                <div className="mt-4 bg-red-500/20 border border-red-500/40 rounded-lg p-4">
                  <p className="text-red-200 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Not enough credits. You need {requiredCredits} credits but only have {creditsRemaining}.
                    <a href="/pricing" className="underline ml-1 hover:text-red-100">Get more credits</a>
                  </p>
                </div>
              )}

              {/* Cannot Proceed Warning */}
              {!canProceed && files.length > 0 && hasValidated && (
                <div className="mt-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-4">
                  <p className="text-yellow-200 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Please upload at least one valid product image to proceed with generation.
                  </p>
                </div>
              )}

              <button
                onClick={processImages}
                disabled={processing || !canProceed || creditsRemaining < requiredCredits}
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
                    {canProceed && ` (${requiredCredits} credits)`}
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
                <li>• Choose your platform format (Instagram, Facebook, YouTube)</li>
                <li>• Get 3 unique marketing styles per valid product automatically:</li>
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