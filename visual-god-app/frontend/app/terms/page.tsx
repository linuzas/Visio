import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
            <Link
              href="/"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-white/80">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-2xl font-semibold text-white mt-6">1. Acceptance of Terms</h2>
            <p className="text-white/80">
              By using Visual God, you agree to these Terms of Service and all applicable laws and regulations.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-6">2. Use of Service</h2>
            <p className="text-white/80">
              You may use Visual God to create marketing content for legitimate business purposes. You agree not to use the service for any illegal or unauthorized purpose.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-6">3. User Content</h2>
            <p className="text-white/80">
              You retain all rights to the images you upload. By using our service, you grant us a limited license to process your images for the purpose of generating marketing content.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-6">4. Privacy</h2>
            <p className="text-white/80">
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect and use your information.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-6">5. Subscription and Credits</h2>
            <p className="text-white/80">
              Credits are consumed when generating images. Unused credits do not roll over to the next billing period. Subscriptions can be cancelled at any time.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-6">6. Limitation of Liability</h2>
            <p className="text-white/80">
              Visual God is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-6">7. Contact</h2>
            <p className="text-white/80">
              If you have any questions about these Terms, please contact us at support@visualgod.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}