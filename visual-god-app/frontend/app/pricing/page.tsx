// File: visual-god-app/frontend/app/pricing/page.tsx
// REPLACE your existing pricing/page.tsx with this

import { CheckCircle, Sparkles, Zap, Star, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navigation/navbar'

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    priceYearly: '$0',
    description: 'Perfect for trying out Visual God',
    credits: 10,
    features: [
      '10 credits per month',
      'Basic support',
      '1080x1920 outputs only',
      'Community access',
      'AI validation included',
      'Basic image compression',
      '1 style per generation'
    ]
  },
  {
    name: 'Starter',
    price: '$9.99',
    priceYearly: '$99.99',
    description: 'Great for content creators',
    credits: 100,
    popular: true,
    features: [
      '100 credits per month',
      'All image sizes (Instagram, Facebook, YouTube)',
      'Email support',
      'History for 30 days',
      'Priority processing',
      'Advanced image compression',
      '3 styles per product',
      'Batch processing'
    ]
  },
  {
    name: 'Pro',
    price: '$29.99',
    priceYearly: '$299.99',
    description: 'For professional marketers',
    credits: 500,
    features: [
      '500 credits per month',
      'All image sizes + custom dimensions',
      'Priority support',
      'Unlimited history',
      'API access (coming soon)',
      'Advanced analytics',
      '5 styles per product',
      'White-label exports',
      'Team collaboration'
    ]
  },
  {
    name: 'Enterprise',
    price: '$99.99',
    priceYearly: '$999.99',
    description: 'For teams and agencies',
    credits: 2000,
    features: [
      '2000 credits per month',
      'Custom sizes & formats',
      '24/7 priority support',
      'Team collaboration tools',
      'Full API access',
      'Custom integrations',
      'Unlimited styles per product',
      'Dedicated account manager',
      'Custom branding options'
    ]
  }
]

const faqs = [
  {
    question: 'What are credits and how do they work?',
    answer: 'Credits are used to generate AI-enhanced images. Each valid product you upload can generate 3 unique marketing styles, using 3 credits total. Our AI validates your images first, so you only use credits on valid product photos.'
  },
  {
    question: 'What happens if I upload non-product images?',
    answer: 'Our AI automatically validates your images before processing. If you upload people, scenes, or other non-product images, they will be rejected and no credits will be used. You\'ll see which images are valid before generating.'
  },
  {
    question: 'Do unused credits roll over to the next month?',
    answer: 'No, credits reset at the beginning of each billing cycle. We recommend using your credits each month to get the most value from your subscription.'
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes! You can cancel your subscription at any time. You\'ll continue to have access to your plan features until the end of your current billing period.'
  },
  {
    question: 'What image formats and sizes are supported?',
    answer: 'We support JPEG, PNG, and WebP formats. Output sizes include Instagram Reels (1080x1920), Facebook Ads (1080x1080), and YouTube Banners (2560x1440). Pro and Enterprise plans include custom dimensions.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, debit cards, and PayPal through our secure payment processor, Stripe. All transactions are encrypted and secure.'
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! Every new user gets 10 free credits to try Visual God. No credit card required. You can test our AI validation and image generation before deciding to upgrade.'
  },
  {
    question: 'How does the AI validation work?',
    answer: 'Our AI analyzes each uploaded image to determine if it\'s a clear product photo. It rejects people, avatars, scenes, or unclear images. You\'ll see validation results immediately after upload, before any credits are used.'
  }
]

export default async function PricingPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <div className="max-w-7xl mx-auto p-8">
        <Navbar user={user} />
        
        {/* Hero Section */}
        <section className="text-center py-20">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-white/80 mb-6">
            Start free, upgrade as you grow. Cancel anytime.
          </p>
          <div className="flex items-center justify-center gap-4 text-white/60 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              AI Validation Included
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              3 Styles Per Product
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Multi-Platform Support
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white/10 backdrop-blur-md rounded-2xl p-8 border transition-all duration-200 transform hover:scale-105 ${
                  plan.popular ? 'border-yellow-400 relative scale-105' : 'border-white/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-purple-900 px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Most Popular
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-white/70 mb-4 text-sm">{plan.description}</p>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-lg font-normal text-white/60">/month</span>
                  </div>
                  <p className="text-sm text-white/60 mb-4">
                    {plan.priceYearly !== plan.price && `or ${plan.priceYearly}/year`}
                  </p>
                  <div className="bg-white/10 rounded-lg p-3 mb-6">
                    <p className="text-white font-semibold">{plan.credits}</p>
                    <p className="text-white/60 text-xs">credits per month</p>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  href={user ? `/dashboard/upgrade?plan=${plan.name.toLowerCase()}` : '/auth/register'}
                  className={`block text-center py-3 rounded-xl font-semibold transition transform hover:scale-105 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                >
                  {user ? 'Upgrade Now' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="py-20">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Why Choose Visual God?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">AI Validation First</h3>
                <p className="text-white/70">
                  Our AI validates your images before processing, ensuring you only use credits on valid product photos. No wasted credits!
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">3 Unique Styles</h3>
                <p className="text-white/70">
                  Get 3 completely different marketing styles per product: street-level giant, 3D billboard, and premium editorial layouts.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Multi-Platform Ready</h3>
                <p className="text-white/70">
                  Generate content optimized for Instagram Reels, Facebook Ads, and YouTube Banners with perfect dimensions for each platform.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition">
                  <h3 className="text-white font-semibold mb-3 text-lg">{faq.question}</h3>
                  <p className="text-white/80 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 text-center">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl p-12 border border-white/20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Products?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Start with 10 free credits. No credit card required. See your products transformed into stunning marketing visuals in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={user ? "/dashboard" : "/auth/register"}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {user ? "Go to Dashboard" : "Start Free Trial"}
              </Link>
              {!user && (
                <Link
                  href="/auth/login"
                  className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg transition transform hover:scale-105"
                >
                  Sign In
                </Link>
              )}
            </div>
            <p className="text-white/60 mt-6 text-sm">
              ✨ AI validation • 🎨 3 styles per product • 📱 Multi-platform ready • 🚫 No setup required
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}