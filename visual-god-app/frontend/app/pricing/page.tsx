import { CheckCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'

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
      '10MB max file size',
      '1 image per generation'
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
      'All image sizes',
      'Email support',
      'History for 30 days',
      'Priority processing',
      '20MB max file size',
      '3 images per generation'
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
      'All image sizes',
      'Priority support',
      'Unlimited history',
      'API access',
      'Advanced analytics',
      '50MB max file size',
      '5 images per generation'
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
      'Custom sizes',
      '24/7 support',
      'Team collaboration',
      'API access',
      'Custom integrations',
      '100MB max file size',
      '10 images per generation'
    ]
  }
]

export default async function PricingPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-white" />
            <span className="text-2xl font-bold text-white">Visual God</span>
          </Link>
          <div className="flex items-center gap-6">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-xl font-medium transition"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-white/80 hover:text-white transition">
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-xl font-medium transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Pricing Section */}
      <section className="container mx-auto px-6 py-20">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-white/80 text-center mb-12">
          Start free, upgrade as you grow. Cancel anytime.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white/10 backdrop-blur-md rounded-2xl p-8 border ${
                plan.popular ? 'border-yellow-400 relative transform scale-105' : 'border-white/20'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-purple-900 px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              )}
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-white/70 mb-4">{plan.description}</p>
              <p className="text-4xl font-bold text-white mb-1">
                {plan.price}
                <span className="text-lg font-normal text-white/60">/month</span>
              </p>
              <p className="text-sm text-white/60 mb-6">or {plan.priceYearly}/year</p>
              <p className="text-white/80 mb-6">{plan.credits} credits included</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/80 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={user ? `/dashboard/upgrade?plan=${plan.name.toLowerCase()}` : '/auth/register'}
                className={`block text-center py-3 rounded-xl font-semibold transition ${
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

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">What are credits?</h3>
              <p className="text-white/80">
                Credits are used to generate images. Most formats use 1 credit per image, while larger formats like YouTube banners use 2 credits.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">Do unused credits roll over?</h3>
              <p className="text-white/80">
                No, credits reset at the beginning of each billing cycle. Make sure to use them before they expire!
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-white/80">
                Yes! You can cancel your subscription at any time. You'll keep access until the end of your current billing period.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-white/80">
                We accept all major credit cards, debit cards, and PayPal through our secure payment processor, Stripe.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}