// File: visual-god-app/frontend/app/dashboard/preferences/preferences-content.tsx
// Standalone preferences component - doesn't affect backend

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Sparkles, ArrowRight, ArrowLeft, Instagram, Facebook, MonitorPlay,
  Palette, Target, Zap, ImageIcon, Package, Wand2, 
  Star, TrendingUp, Heart, Brush, Camera, Layers, CheckCircle,
  Users, ShoppingBag, Award, Globe, Coffee, Gamepad2, Music,
  Home, Car, Book, Dumbbell, Baby, PawPrint, Shirt, Smartphone,
  Save, Settings
} from 'lucide-react'

interface PreferencesContentProps {
  profile: any
  user: any
}

interface UserPreferences {
  platforms: string[]
  styles: string[]
  industries: string[]
  tones: string[]
  imageCount: number
  priority: string
}

export function PreferencesContent({ profile, user }: PreferencesContentProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [preferences, setPreferences] = useState<UserPreferences>({
    platforms: [],
    styles: [],
    industries: [],
    tones: [],
    imageCount: 3,
    priority: 'quality'
  })

  // Platform options
  const platforms = [
    {
      id: 'instagram',
      name: 'Instagram Reels',
      icon: Instagram,
      description: 'Vertical 9:16 format',
      size: '1080x1920',
      popular: true
    },
    {
      id: 'facebook',
      name: 'Facebook Ads',
      icon: Facebook,
      description: 'Square 1:1 format',
      size: '1080x1080',
      popular: true
    },
    {
      id: 'youtube',
      name: 'YouTube Banners',
      icon: MonitorPlay,
      description: 'Landscape 16:9 format',
      size: '2560x1440',
      popular: false
    }
  ]

  // Style categories with subcategories
  const styleCategories = [
    {
      id: 'realistic',
      name: 'Photorealistic',
      icon: Camera,
      description: 'Hyper-realistic product photography',
      styles: [
        { id: 'studio', name: 'Studio Photography', description: 'Clean, professional studio shots' },
        { id: 'lifestyle', name: 'Lifestyle Photography', description: 'Products in real-life settings' },
        { id: 'macro', name: 'Macro Detail', description: 'Close-up detailed shots' }
      ]
    },
    {
      id: 'artistic',
      name: 'Artistic & Creative',
      icon: Palette,
      description: 'Stylized and artistic renderings',
      styles: [
        { id: 'watercolor', name: 'Watercolor Art', description: 'Soft, artistic watercolor style' },
        { id: 'geometric', name: 'Geometric Abstract', description: 'Modern geometric patterns' },
        { id: 'vintage', name: 'Vintage Aesthetic', description: 'Retro and vintage-inspired' }
      ]
    },
    {
      id: 'dimensional',
      name: '3D & Dimensional',
      icon: Layers,
      description: 'Three-dimensional visualizations',
      styles: [
        { id: 'isometric', name: 'Isometric 3D', description: 'Clean isometric perspective' },
        { id: 'floating', name: 'Floating Elements', description: 'Products floating in space' },
        { id: 'exploded', name: 'Exploded View', description: 'Deconstructed product views' }
      ]
    },
    {
      id: 'surreal',
      name: 'Surreal & Fantasy',
      icon: Wand2,
      description: 'Imaginative and fantastical scenes',
      styles: [
        { id: 'giant', name: 'Giant Scale', description: 'Products in oversized environments' },
        { id: 'dreamy', name: 'Dreamy Atmosphere', description: 'Ethereal, dream-like settings' },
        { id: 'cosmic', name: 'Cosmic Space', description: 'Products in space environments' }
      ]
    }
  ]

  // Industry categories
  const industries = [
    { id: 'fashion', name: 'Fashion & Apparel', icon: Shirt },
    { id: 'tech', name: 'Technology', icon: Smartphone },
    { id: 'beauty', name: 'Beauty & Cosmetics', icon: Heart },
    { id: 'food', name: 'Food & Beverage', icon: Coffee },
    { id: 'home', name: 'Home & Decor', icon: Home },
    { id: 'fitness', name: 'Health & Fitness', icon: Dumbbell },
    { id: 'automotive', name: 'Automotive', icon: Car },
    { id: 'gaming', name: 'Gaming', icon: Gamepad2 },
    { id: 'books', name: 'Books & Media', icon: Book },
    { id: 'music', name: 'Music & Audio', icon: Music },
    { id: 'baby', name: 'Baby & Kids', icon: Baby },
    { id: 'pets', name: 'Pet Products', icon: PawPrint }
  ]

  // Tone/mood options
  const tones = [
    { id: 'professional', name: 'Professional', description: 'Clean, corporate, trustworthy', color: 'blue' },
    { id: 'playful', name: 'Playful', description: 'Fun, energetic, vibrant', color: 'orange' },
    { id: 'luxury', name: 'Luxury', description: 'Premium, elegant, sophisticated', color: 'purple' },
    { id: 'minimalist', name: 'Minimalist', description: 'Simple, clean, modern', color: 'gray' },
    { id: 'bold', name: 'Bold & Edgy', description: 'Striking, dramatic, attention-grabbing', color: 'red' },
    { id: 'natural', name: 'Natural & Organic', description: 'Earthy, sustainable, authentic', color: 'green' }
  ]

  const handleSelectionToggle = (category: keyof UserPreferences, item: string) => {
    setPreferences(prev => {
      const currentArray = prev[category] as string[]
      return {
        ...prev,
        [category]: currentArray.includes(item)
          ? currentArray.filter(i => i !== item)
          : [...currentArray, item]
      }
    })
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const getStepTitle = (step: number) => {
    switch(step) {
      case 1: return 'Choose Your Platforms'
      case 2: return 'Select Visual Styles'
      case 3: return 'Pick Your Industry'
      case 4: return 'Set the Tone'
      case 5: return 'Final Preferences'
      default: return 'Customize Your Experience'
    }
  }

  const canProceed = () => {
    switch(currentStep) {
      case 1: return preferences.platforms.length > 0
      case 2: return preferences.styles.length > 0
      case 3: return preferences.industries.length > 0
      case 4: return preferences.tones.length > 0
      case 5: return true
      default: return false
    }
  }

  const handleSavePreferences = () => {
    // This is a mockup - preferences don't affect backend yet
    console.log('Saving preferences (mockup):', preferences)
    
    // Show a success message and redirect
    alert('Preferences saved! (This is a mockup - doesn\'t affect content generation yet)')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-8 shadow-2xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Content Preferences</h1>
                <p className="text-white/70">Customize your content generation experience</p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="text-white/60 hover:text-white/80 transition-colors flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline">Back to Dashboard</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center mb-4">
            {[1, 2, 3, 4, 5].map((step) => (
              <React.Fragment key={step}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step <= currentStep 
                    ? 'bg-white text-purple-600' 
                    : 'bg-white/20 text-white/50'
                }`}>
                  {step < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : step}
                </div>
                {step < 5 && (
                  <div className={`flex-1 h-1 mx-2 rounded transition-all ${
                    step < currentStep ? 'bg-white' : 'bg-white/20'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-white/60 text-sm">Step {currentStep} of 5: {getStepTitle(currentStep)}</p>
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
          {/* Step 1: Platform Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-3">Where will you share your content?</h2>
                <p className="text-white/70">Select one or more platforms to optimize your images</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {platforms.map((platform) => {
                  const IconComponent = platform.icon
                  const isSelected = preferences.platforms.includes(platform.id)
                  
                  return (
                    <button
                      key={platform.id}
                      onClick={() => handleSelectionToggle('platforms', platform.id)}
                      className={`relative p-6 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                        isSelected
                          ? 'border-white bg-white/20 text-white scale-105'
                          : 'border-white/30 hover:border-white/50 text-white/80 hover:text-white'
                      }`}
                    >
                      {platform.popular && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-purple-900 text-xs font-bold px-2 py-1 rounded-full">
                          Popular
                        </div>
                      )}
                      
                      <div className="flex flex-col items-center text-center">
                        <IconComponent className="w-12 h-12 mb-4" />
                        <h3 className="font-semibold text-lg mb-2">{platform.name}</h3>
                        <p className="text-sm opacity-80 mb-2">{platform.description}</p>
                        <p className="text-xs font-mono opacity-60">{platform.size}</p>
                      </div>

                      {isSelected && (
                        <div className="absolute top-4 right-4">
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2: Style Selection */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-3">What's your visual style?</h2>
                <p className="text-white/70">Choose styles that match your brand aesthetic</p>
              </div>

              {styleCategories.map((category) => {
                const IconComponent = category.icon
                
                return (
                  <div key={category.id} className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <IconComponent className="w-6 h-6 text-white" />
                      <h3 className="text-xl font-semibold text-white">{category.name}</h3>
                      <p className="text-white/60 text-sm">{category.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {category.styles.map((style) => {
                        const isSelected = preferences.styles.includes(style.id)
                        
                        return (
                          <button
                            key={style.id}
                            onClick={() => handleSelectionToggle('styles', style.id)}
                            className={`p-4 rounded-xl border-2 transition-all text-left transform hover:scale-105 ${
                              isSelected
                                ? 'border-white bg-white/20 text-white scale-105'
                                : 'border-white/30 hover:border-white/50 text-white/80 hover:text-white'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium">{style.name}</h4>
                              {isSelected && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                            </div>
                            <p className="text-sm opacity-70">{style.description}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Step 3: Industry Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-3">What industry are you in?</h2>
                <p className="text-white/70">Help us understand your market for better targeting</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {industries.map((industry) => {
                  const IconComponent = industry.icon
                  const isSelected = preferences.industries.includes(industry.id)
                  
                  return (
                    <button
                      key={industry.id}
                      onClick={() => handleSelectionToggle('industries', industry.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-center transform hover:scale-105 ${
                        isSelected
                          ? 'border-white bg-white/20 text-white scale-105'
                          : 'border-white/30 hover:border-white/50 text-white/80 hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <IconComponent className="w-8 h-8 mb-2" />
                        <span className="text-sm font-medium">{industry.name}</span>
                      </div>
                      
                      {isSelected && (
                        <div className="mt-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 4: Tone Selection */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-3">What tone fits your brand?</h2>
                <p className="text-white/70">Choose the mood and feeling for your content</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tones.map((tone) => {
                  const isSelected = preferences.tones.includes(tone.id)
                  
                  return (
                    <button
                      key={tone.id}
                      onClick={() => handleSelectionToggle('tones', tone.id)}
                      className={`p-6 rounded-xl border-2 transition-all text-left transform hover:scale-105 ${
                        isSelected
                          ? 'border-white bg-white/20 text-white scale-105'
                          : 'border-white/30 hover:border-white/50 text-white/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg">{tone.name}</h3>
                        {isSelected && <CheckCircle className="w-5 h-5 text-green-400" />}
                      </div>
                      <p className="text-sm opacity-80">{tone.description}</p>
                      
                      {/* Color indicator */}
                      <div className="mt-3 flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-${tone.color}-400`} />
                        <span className="text-xs opacity-60 capitalize">{tone.color} palette</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 5: Final Preferences */}
          {currentStep === 5 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-3">Final touches</h2>
                <p className="text-white/70">Customize the output to your needs</p>
              </div>

              <div className="space-y-6">
                {/* Image Count */}
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Images per product
                  </h3>
                  <div className="flex items-center gap-4">
                    {[1, 3, 5, 10].map((count) => (
                      <button
                        key={count}
                        onClick={() => setPreferences(prev => ({ ...prev, imageCount: count }))}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          preferences.imageCount === count
                            ? 'bg-white text-purple-600'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                  <p className="text-white/60 text-sm mt-2">
                    More images = more credits needed per product
                  </p>
                </div>

                {/* Priority Setting */}
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Processing Priority
                  </h3>
                  <div className="space-y-3">
                    {[
                      { id: 'quality', name: 'Quality First', desc: 'Best results, slower processing' },
                      { id: 'balanced', name: 'Balanced', desc: 'Good quality, reasonable speed' },
                      { id: 'speed', name: 'Speed First', desc: 'Faster results, good quality' }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setPreferences(prev => ({ ...prev, priority: option.id }))}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          preferences.priority === option.id
                            ? 'border-white bg-white/20 text-white'
                            : 'border-white/30 hover:border-white/50 text-white/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{option.name}</h4>
                            <p className="text-sm opacity-70">{option.desc}</p>
                          </div>
                          {preferences.priority === option.id && (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-white/20">
                  <h3 className="text-white font-semibold mb-4">Your Selection Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-white/60">Platforms:</p>
                      <p className="text-white">{preferences.platforms.length} selected</p>
                    </div>
                    <div>
                      <p className="text-white/60">Styles:</p>
                      <p className="text-white">{preferences.styles.length} selected</p>
                    </div>
                    <div>
                      <p className="text-white/60">Industries:</p>
                      <p className="text-white">{preferences.industries.length} selected</p>
                    </div>
                    <div>
                      <p className="text-white/60">Images per product:</p>
                      <p className="text-white">{preferences.imageCount}</p>
                    </div>
                  </div>
                </div>

                {/* Mockup Notice */}
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-blue-300 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-blue-200 font-medium mb-1">Development Preview</h4>
                      <p className="text-blue-300/80 text-sm">
                        This preferences system is a mockup. Your selections will be saved but won't affect content generation yet. 
                        This helps us understand what customization options you'd like to see in future updates.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/20">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="text-center text-white/60 text-sm">
              {currentStep < 5 ? 'Customize your experience for better results' : 'Ready to save your preferences!'}
            </div>

            {currentStep < 5 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSavePreferences}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white transition-all transform hover:scale-105 font-semibold"
              >
                <Save className="w-5 h-5" />
                Save Preferences
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}