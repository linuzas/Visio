'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, User, Mail, CreditCard, Camera, Save, 
  Loader2, CheckCircle, AlertCircle, Shield, Calendar,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface ProfileContentProps {
  profile: any
  stats: any
  user: any
}

export function ProfileContent({ profile, stats, user }: ProfileContentProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    full_name: profile?.full_name || '',
    email: user?.email || ''
  })

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          full_name: formData.full_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setEditing(false)
      router.refresh()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    setMessage(null)

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('user-content')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath)

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setMessage({ type: 'success', text: 'Avatar updated successfully!' })
      router.refresh()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <User className="w-8 h-8" />
              My Profile
            </h1>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-green-500/20 border border-green-400' 
                : 'bg-red-500/20 border border-red-400'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-300" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-300" />
              )}
              <p className={message.type === 'success' ? 'text-green-200' : 'text-red-200'}>
                {message.text}
              </p>
            </div>
          )}

          {/* Profile Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Avatar Section */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full bg-white/20 overflow-hidden mx-auto">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-white/60" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-purple-500 hover:bg-purple-600 rounded-full p-2 cursor-pointer transition shadow-lg">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              {uploadingAvatar && (
                <p className="text-white/60 text-sm mt-2 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </p>
              )}
            </div>

            {/* Profile Info */}
            <div className="md:col-span-2 space-y-6">
              {/* Account Info */}
              <div className="bg-white/10 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Account Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Username</label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full bg-black/30 border border-white/30 rounded-lg px-4 py-2 text-white"
                      />
                    ) : (
                      <p className="text-white">{profile?.username || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Full Name</label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full bg-black/30 border border-white/30 rounded-lg px-4 py-2 text-white"
                      />
                    ) : (
                      <p className="text-white">{profile?.full_name || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Email</label>
                    <p className="text-white flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {user?.email}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 flex gap-3">
                  {editing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false)
                          setFormData({
                            username: profile?.username || '',
                            full_name: profile?.full_name || '',
                            email: user?.email || ''
                          })
                        }}
                        className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditing(true)}
                      className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              {/* Subscription Info */}
              <div className="bg-white/10 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Subscription Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/60">Current Plan</span>
                    <span className="text-white font-medium capitalize">{profile?.plan || 'Free'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Credits Remaining</span>
                    <span className="text-white font-medium">
                      {stats?.credits_remaining || 0} / {profile?.credits_total || 10}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Member Since</span>
                    <span className="text-white">
                      {new Date(profile?.created_at || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  {profile?.plan === 'free' && (
                    <Link
                      href="/pricing"
                      className="block mt-4 text-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 rounded-lg transition"
                    >
                      Upgrade Plan
                    </Link>
                  )}
                </div>
              </div>

              {/* Usage Stats */}
              <div className="bg-white/10 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Usage Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{stats?.total_images_generated || 0}</p>
                    <p className="text-white/60 text-sm">Images Created</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{stats?.total_sessions || 0}</p>
                    <p className="text-white/60 text-sm">Sessions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{stats?.total_products_scanned || 0}</p>
                    <p className="text-white/60 text-sm">Products Scanned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{stats?.credits_used || 0}</p>
                    <p className="text-white/60 text-sm">Credits Used</p>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="bg-white/10 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security
                </h3>
                <div className="space-y-3">
                  <button className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg transition text-left px-4">
                    Change Password
                  </button>
                  <button className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg transition text-left px-4">
                    Two-Factor Authentication
                  </button>
                  <button className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-200 py-2 rounded-lg transition text-left px-4 border border-red-500/40">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}