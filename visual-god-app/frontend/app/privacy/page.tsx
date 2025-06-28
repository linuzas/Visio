import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
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
            
            <h2 className="text-2xl font-semibold text-white mt-6">1. Information We Collect</h2>
            <p className="text-white/80">
              We collect information you provide directly to us, such as when you create an account, upload images, or contact us for support.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-6">2. How We Use Your Information</h2>
            <p className="text-white/80">
              We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-6">3. Image Processing</h2>
            <p className="text-white/80">
              Images you upload are processed using AI technology to generate marketing content. We do not share your images with third parties without your consent.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-6">4. Data Security</h2>
            <p className="text-white/80">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-6">5. Data Retention</h2>
            <p className="text-white/80">
              We retain your information for as long as your account is active or as needed to provide you services. You can request deletion of your data at any time.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-6">6. Your Rights</h2>
            <p className="text-white/80">
              You have the right to access, update, or delete your personal information. You can manage your information through your account settings or by contacting us.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-6">7. Contact Us</h2>
            <p className="text-white/80">
              If you have any questions about this Privacy Policy, please contact us at privacy@visualgod.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}