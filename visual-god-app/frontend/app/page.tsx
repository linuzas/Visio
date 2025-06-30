// File: visual-god-app/frontend/app/page.tsx
// FIXED VERSION - No navigation, clean landing page

import Link from 'next/link'
import { ArrowRight, Sparkles, Zap, Shield, CreditCard, Instagram, Facebook, MonitorPlay, CheckCircle } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'

const features = [
  {
    icon: Instagram,
    title: 'Instagram Reels',
    description: 'Create stunning 9:16 vertical content optimized for Instagram Reels engagement'
  },
  {
    icon: Facebook,
    title: 'Facebook Ads',
    description: 'Generate eye-catching 1:1 square visuals perfect for Facebook feed ads'
  },
  {
    icon: MonitorPlay,
    title: 'YouTube Banners',
    description: 'Design professional 16:9 widescreen banners that look great on all devices'
  },
  {
    icon: Zap,
    title: 'AI-Powered',
    description: 'Advanced GPT-Image-1 model creates unique, high-quality marketing visuals'
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your images and data are encrypted and never shared with third parties'
  },
  {
    icon: CreditCard,
    title: 'Flexible Pricing',
    description: 'Start free, upgrade as you grow. Cancel anytime, no questions asked'
  }
]

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for trying out Visual God',
    credits: 10,
    features: [
      '10 credits per month',
      'Basic support',
      '1080x1920 outputs only',
      'Community access'
    ]
  },
  {
    name: 'Starter',
    price: '$9.99',
    description: 'Great for content creators',
    credits: 100,
    popular: true,
    features: [
      '100 credits per month',
      'All image sizes',
      'Email support',
      'History for 30 days',
      'Priority processing'
    ]
  },
  {
    name: 'Pro',
    price: '$29.99',
    description: 'For professional marketers',
    credits: 500,
    features: [
      '500 credits per month',
      'All image sizes',
      'Priority support',
      'Unlimited history',
      'API access',
      'Advanced analytics'
    ]
  }
]

// Simple landing page navbar - NO complex navigation
function LandingNavbar({ user }: { user?: any }) {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white" />
          <span className="text-lg md:text-2xl font-bold text-white">Visual God</span>
        </div>

        {/* Simple auth buttons */}
        <div className="flex items-center gap-2 md:gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="bg-white/20 hover:bg-white/30 backdrop-blur text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium transition transform hover:scale-105 text-sm md:text-base"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-white/80 hover:text-white px-3 md:px-4 py-2 transition text-sm md:text-base"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="bg-white/20 hover:bg-white/30 backdrop-blur text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium transition transform hover:scale-105 text-sm md:text-base"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default async function LandingPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <LandingNavbar user={user} />
      
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Hero Section */}
        <section className="pt-20 md:pt-32 pb-12 md:pb-20 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Transform Your Products Into<br />
            <span className="bg-gradient-to-r from-yellow-200 to-pink-200 text-transparent bg-clip-text">
              Stunning Marketing Visuals
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Upload your product images and let AI create professional marketing content for Instagram, Facebook, and YouTube in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={user ? "/dashboard" : "/auth/register"}
              className="bg-white text-purple-600 hover:bg-white/90 px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2 shadow-lg transform hover:scale-105"
            >
              {user ? "Go to Dashboard" : "Start Creating Free"}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#demo"
              className="bg-white/20 backdrop-blur hover:bg-white/30 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold text-lg transition transform hover:scale-105"
            >
              Watch Demo
            </Link>
          </div>
          <p className="text-white/60 mt-4 text-sm md:text-base">No credit card required • 10 free credits • AI validation included</p>
        </section>

        {/* Features Grid */}
        <section className="py-12 md:py-20" id="features">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white text-center mb-8 md:mb-12">
            Everything You Need to Create Amazing Content
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 transform hover:scale-105"
              >
                <feature.icon className="w-10 h-10 md:w-12 md:h-12 text-white mb-4" />
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/70 text-sm md:text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 md:py-20" id="how-it-works">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white text-center mb-8 md:mb-12">
            Create Professional Content in 4 Simple Steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              {
                step: '1',
                title: 'Upload Images',
                description: 'Upload your product photos - AI automatically validates them'
              },
              {
                step: '2',
                title: 'Review & Approve',
                description: 'See which images are valid products before proceeding'
              },
              {
                step: '3',
                title: 'Choose Platform',
                description: 'Select Instagram, Facebook, or YouTube format'
              },
              {
                step: '4',
                title: 'Download & Share',
                description: 'Get 3 unique marketing styles per product, ready to post'
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 transform hover:scale-110 transition">
                  <span className="text-xl md:text-2xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-white/70 text-sm md:text-base">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-12 md:py-20" id="pricing">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-white/80 text-center mb-8 md:mb-12 text-lg">
            Start free, upgrade as you grow
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border transition-all duration-200 transform hover:scale-105 ${
                  plan.popular ? 'border-yellow-400 relative' : 'border-white/20'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-purple-900 px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-white/70 mb-4 text-sm md:text-base">{plan.description}</p>
                <p className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {plan.price}
                  <span className="text-base md:text-lg font-normal text-white/60">/month</span>
                </p>
                <p className="text-white/80 mb-6">{plan.credits} credits included</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm md:text-base">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={user ? "/dashboard" : "/auth/register"}
                  className={`block text-center py-3 rounded-xl font-semibold transition transform hover:scale-105 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                >
                  {user ? "Go to Dashboard" : "Get Started"}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-12 md:py-20" id="demo">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/20">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white text-center mb-6">
              See Visual God in Action
            </h2>
            <p className="text-lg md:text-xl text-white/80 text-center mb-8 max-w-2xl mx-auto">
              Watch how our AI transforms ordinary product photos into stunning marketing visuals in seconds.
            </p>
            <div className="text-center">
              <div className="bg-white/10 rounded-2xl p-6 md:p-8 max-w-4xl mx-auto">
                <div className="aspect-video bg-white/5 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <p className="text-white/60">Demo video coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-20 text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 max-w-3xl mx-auto border border-white/20">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Create Amazing Content?
            </h2>
            <p className="text-lg md:text-xl text-white/80 mb-8">
              Join thousands of creators using Visual God to transform their products into stunning marketing visuals.
            </p>
            <Link
              href={user ? "/dashboard" : "/auth/register"}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold text-lg transition shadow-lg transform hover:scale-105"
            >
              {user ? "Go to Dashboard" : "Start Your Free Trial"}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-white/60 mt-4 text-sm md:text-base">✨ AI validation • 3 styles per product • No setup required</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 md:py-12 border-t border-white/20 mt-12 md:mt-20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-white" />
              <span className="text-lg font-semibold text-white">Visual God</span>
            </div>
            <div className="flex gap-4 md:gap-6">
              <Link href="/terms" className="text-white/60 hover:text-white transition text-sm md:text-base">
                Terms
              </Link>
              <Link href="/privacy" className="text-white/60 hover:text-white transition text-sm md:text-base">
                Privacy
              </Link>
              <Link href="/contact" className="text-white/60 hover:text-white transition text-sm md:text-base">
                Contact
              </Link>
            </div>
            <p className="text-white/60 text-sm md:text-base">© 2024 Visual God. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}