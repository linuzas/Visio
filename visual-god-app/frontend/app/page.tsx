// visual-god-app/frontend/app/page.tsx
import Link from 'next/link'
import { ArrowRight, Sparkles, Zap, Shield, CreditCard, Instagram, Facebook, MonitorPlay, CheckCircle } from 'lucide-react'

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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-white" />
            <span className="text-2xl font-bold text-white">Visual God</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-white/80 hover:text-white transition">
              Pricing
            </Link>
            <Link href="/auth/login" className="text-white/80 hover:text-white transition">
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-xl font-medium transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Transform Your Products Into<br />
          <span className="bg-gradient-to-r from-yellow-200 to-pink-200 text-transparent bg-clip-text">
            Stunning Marketing Visuals
          </span>
        </h1>
        <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
          Upload your product images and let AI create professional marketing content for Instagram, Facebook, and YouTube in seconds.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/register"
            className="bg-white text-purple-600 hover:bg-white/90 px-8 py-4 rounded-xl font-semibold text-lg transition flex items-center gap-2 shadow-lg"
          >
            Start Creating Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="#demo"
            className="bg-white/20 backdrop-blur hover:bg-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg transition"
          >
            Watch Demo
          </Link>
        </div>
        <p className="text-white/60 mt-4">No credit card required • 10 free credits</p>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          Everything You Need to Create Amazing Content
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition"
            >
              <feature.icon className="w-12 h-12 text-white mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          Create Professional Content in 3 Simple Steps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">1</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Upload Images</h3>
            <p className="text-white/70">Upload your product photos and optional avatar images</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">2</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Choose Platform</h3>
            <p className="text-white/70">Select Instagram, Facebook, or YouTube format</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">3</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Download & Share</h3>
            <p className="text-white/70">Get your AI-enhanced visuals ready to post</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-white/80 text-center mb-12 text-lg">
          Start free, upgrade as you grow
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white/10 backdrop-blur-md rounded-2xl p-8 border ${
                plan.popular ? 'border-yellow-400 relative' : 'border-white/20'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-purple-900 px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              )}
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-white/70 mb-4">{plan.description}</p>
              <p className="text-4xl font-bold text-white mb-2">
                {plan.price}
                <span className="text-lg font-normal text-white/60">/month</span>
              </p>
              <p className="text-white/80 mb-6">{plan.credits} credits included</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className={`block text-center py-3 rounded-xl font-semibold transition ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 max-w-3xl mx-auto border border-white/20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Create Amazing Content?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of creators using Visual God to transform their products into stunning marketing visuals.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition shadow-lg"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-white/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-white" />
            <span className="text-lg font-semibold text-white">Visual God</span>
          </div>
          <div className="flex gap-6">
            <Link href="/terms" className="text-white/60 hover:text-white transition">
              Terms
            </Link>
            <Link href="/privacy" className="text-white/60 hover:text-white transition">
              Privacy
            </Link>
            <Link href="/contact" className="text-white/60 hover:text-white transition">
              Contact
            </Link>
          </div>
          <p className="text-white/60">© 2024 Visual God. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}