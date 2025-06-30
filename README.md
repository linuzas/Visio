# 🎨 Visual God - AI-Powered Multi-Platform Content Creator

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)](https://nextjs.org/) [![React](https://img.shields.io/badge/React-19.0.0-blue)](https://reactjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.9-06B6D4)](https://tailwindcss.com/) [![Supabase](https://img.shields.io/badge/Supabase-2.50.2-3ECF8E)](https://supabase.com/) [![Railway](https://img.shields.io/badge/Railway-Backend-0B0D0E)](https://railway.app/) [![Vercel](https://img.shields.io/badge/Vercel-Frontend-black)](https://vercel.com/)

## 🚀 [Live Demo](https://visual-god-app.vercel.app)

**Visual God** is an AI-powered platform that transforms ordinary product images into stunning marketing visuals optimized for Instagram Reels, Facebook Ads, and YouTube Banners. Built with modern web technologies and powered by OpenAI's GPT-Image-1 model, it offers a complete product-only workflow with AI validation, automatic content generation, and multi-platform optimization.

---

## ✨ Key Features

### 🤖 **AI-Powered Product Processing**
- **Smart Image Validation**: AI automatically detects and validates product images, rejecting people, avatars, or scenes
- **Product-Only Workflow**: Focused exclusively on physical products (electronics, fashion, cosmetics, food, etc.)
- **Real-time Analysis**: Instant feedback on image quality and suitability

### 🎨 **Multi-Style Content Generation**
- **3 Unique Styles Per Product**: Automatically generates diverse marketing approaches
  - Street-level giant product perspective
  - 3D billboard advertisement style
  - Premium editorial catalog layout
- **GPT-Image-1 Enhancement**: Uses OpenAI's latest image editing model for professional results

### 📱 **Multi-Platform Optimization**
- **Instagram Reels**: 1080x1920 vertical format (9:16)
- **Facebook Photo Ads**: 1080x1080 square format (1:1)
- **YouTube Banners**: 2560x1440 widescreen format (16:9)
- **Automatic Resizing**: Perfect dimensions for each platform

### 🔐 **User Management & Analytics**
- **Supabase Authentication**: Secure user registration with email confirmation
- **Credit System**: Transparent usage tracking and limits
- **Usage Analytics**: Detailed statistics and history
- **File Storage**: Secure image storage with automatic cleanup

---

## 🏗️ Tech Stack

### **Frontend (Vercel)**
- **[Next.js 15.3.3](https://nextjs.org/)** - React framework with App Router
- **[React 19.0.0](https://reactjs.org/)** - Latest React with modern features
- **[TypeScript 5.8.3](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS 4.1.9](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library
- **[Supabase SSR](https://supabase.com/docs/guides/auth/server-side-rendering)** - Server-side authentication

### **Backend (Railway)**
- **[FastAPI](https://fastapi.tiangolo.com/)** - Modern Python web framework
- **[LangChain](https://langchain.com/)** - AI application framework
- **[LangGraph](https://langchain-ai.github.io/langgraph/)** - Workflow orchestration
- **[OpenAI GPT-Image-1](https://openai.com/)** - Advanced image editing model
- **[Pillow](https://pillow.readthedocs.io/)** - Image processing
- **[Uvicorn](https://www.uvicorn.org/)** - ASGI server

### **Database & Storage**
- **[Supabase](https://supabase.com/)** - PostgreSQL database with real-time features
- **Supabase Storage** - File storage for generated images
- **Supabase Auth** - User authentication and management

### **AI & Processing**
- **OpenAI GPT-4o** - Product validation and analysis
- **OpenAI GPT-Image-1** - Image generation and enhancement
- **Custom AI Workflows** - Multi-step processing pipelines

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Supabase account
- OpenAI API key

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/visual-god-app.git
cd visual-god-app
```

### 2. Environment Setup
Create `.env.local` in the root directory:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Backend Configuration
BACKEND_URL=http://localhost:8000
PORT=8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Database Setup
Run the SQL migrations in your Supabase dashboard to create the required tables and views.

---

## 🏭 Deployment

### **Frontend (Vercel)**
The frontend is automatically deployed to Vercel:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with zero configuration

**Vercel Configuration:**
- Framework: Next.js
- Build Command: `cd frontend && npm run build`
- Output Directory: `frontend/.next`
- Install Command: `cd frontend && npm install`

### **Backend (Railway)**
The backend is deployed to Railway for scalable AI processing:

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway automatically detects the Python app

**Railway Configuration:**
- Runtime: Python 3.11
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Auto-scaling enabled for high traffic

---

## 🔄 How It Works

### 1. **Image Upload & Validation**
```
User uploads images → AI validates product quality → Filters valid products
```

### 2. **Content Generation**
```
Valid products → Generate 3 unique prompts → Process with GPT-Image-1 → Resize for platforms
```

### 3. **Multi-Platform Delivery**
```
Generated images → Platform optimization → User download → Analytics tracking
```

---

## 🎯 Product Workflow

### **Validation Process**
- Upload multiple product images
- AI analyzes each image for product suitability
- Rejects people, avatars, scenes, or unclear images
- Shows confidence scores and rejection reasons
- Only processes valid products (confidence > 70%)

### **Generation Process**
- 3 credits per valid product (1 credit per style)
- Automatic prompt generation for marketing contexts
- GPT-Image-1 enhancement with professional quality
- Platform-specific resizing and optimization
- Secure storage with public URLs

### **User Experience**
- Real-time validation feedback
- Progress tracking during processing
- Downloadable results with organized naming
- Usage history and analytics
- Credit management and billing

---

## 🛠️ API Endpoints

### **Frontend API Routes**
- `POST /api/validate` - Validate uploaded images
- `POST /api/process` - Full processing pipeline
- `GET /api/sizes` - Supported image formats

### **Backend API Routes**
- `POST /api/validate` - Image validation service
- `POST /api/process` - Main processing endpoint
- `POST /api/generate-only` - Image generation only
- `GET /api/pricing` - Pricing information
- `GET /health` - Health check

---

## 📊 Database Schema

### **Core Tables**
- `profiles` - User accounts and plans
- `generation_sessions` - Processing sessions
- `generated_images` - Image metadata and storage
- `usage_logs` - Analytics and billing

### **Views**
- `user_statistics` - Aggregated user metrics
- Credit tracking and usage analytics

---

## 🔧 Key Features & Limitations

### ✅ **What Works**
- AI product validation with high accuracy
- Multi-platform image generation
- User authentication and credit system
- File storage and download functionality
- Real-time processing feedback
- Mobile-responsive design

### ⚠️ **Known Issues**
- **Email Confirmation**: Works but redirect flow needs improvement
- **History Page**: Slow loading with large image datasets
- **Mobile Navigation**: Some UI polish needed
- **Error Handling**: Some edge cases need better messaging
- **Performance**: Large batch processing could be optimized

### 🚧 **Future Enhancements**
- Custom prompt editing
- Brand color/style consistency
- Batch processing improvements
- Advanced analytics dashboard
- API rate limiting
- Custom image dimensions
- Team collaboration features

---

## 🎨 Design Philosophy

**Simple Concept, Ready to Scale**: Visual God focuses on doing one thing exceptionally well - transforming product images into marketing content. The architecture is designed for growth with:

- **Modular Components**: Easy to extend and modify
- **Cloud-Native**: Scalable deployment on modern platforms
- **API-First**: Ready for mobile apps and integrations
- **Performance-Focused**: Optimized for fast user experiences

---

## 📈 Performance & Scaling

### **Current Metrics**
- Image processing: 30-60 seconds per batch
- Concurrent users: Optimized for 100+ simultaneous sessions
- File storage: Automatic cleanup and optimization
- API responses: < 200ms for validation, < 3min for generation

### **Scaling Strategy**
- **Frontend**: Vercel edge deployment with global CDN
- **Backend**: Railway auto-scaling with load balancing
- **Database**: Supabase with connection pooling
- **Storage**: Distributed file storage with CDN

---

## 🤝 Contributing

We welcome contributions! The codebase is well-structured and ready for community involvement:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### **Development Areas**
- UI/UX improvements
- Performance optimizations
- New AI models integration
- Mobile app development
- Additional platform support

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Live Demo**: [visual-god-app.vercel.app](https://visual-god-app.vercel.app)
- **GitHub**: [Repository](https://github.com/yourusername/visual-god-app)
- **Issues**: [Bug Reports & Feature Requests](https://github.com/yourusername/visual-god-app/issues)

---

## 📞 Support

For questions, issues, or feature requests:
- Open a GitHub issue
- Contact us at: support@visualgod.com
- Join our community Discord

---

---

## 🗄️ Database Schema

### **Complete Supabase Setup**

Run this SQL in your Supabase SQL Editor to set up the complete database schema:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_plan AS ENUM ('free', 'starter', 'pro', 'enterprise');
CREATE TYPE generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Users profile table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    plan user_plan DEFAULT 'free',
    credits_total INTEGER DEFAULT 10, -- Free tier starts with 10 credits
    credits_used INTEGER DEFAULT 0,
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Plan tiers configuration
CREATE TABLE plan_tiers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    monthly_credits INTEGER NOT NULL,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB,
    max_file_size_mb INTEGER DEFAULT 10,
    max_images_per_generation INTEGER DEFAULT 5,
    priority_support BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert default plan tiers
INSERT INTO plan_tiers (name, display_name, monthly_credits, price_monthly, price_yearly, features, max_file_size_mb, max_images_per_generation) VALUES
('free', 'Free', 10, 0, 0, '{"features": ["10 credits/month", "Basic support", "1080x1920 outputs only"]}', 10, 1),
('starter', 'Starter', 100, 9.99, 99.99, '{"features": ["100 credits/month", "All image sizes", "Email support", "History for 30 days"]}', 20, 3),
('pro', 'Pro', 500, 29.99, 299.99, '{"features": ["500 credits/month", "All image sizes", "Priority support", "Unlimited history", "API access"]}', 50, 5),
('enterprise', 'Enterprise', 2000, 99.99, 999.99, '{"features": ["2000 credits/month", "Custom sizes", "24/7 support", "Team collaboration", "API access", "Custom integrations"]}', 100, 10);

-- Generation sessions table
CREATE TABLE generation_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_name TEXT,
    status generation_status DEFAULT 'pending',
    credits_used INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE generation_sessions ENABLE ROW LEVEL SECURITY;

-- Generation sessions policies
CREATE POLICY "Users can view own sessions" ON generation_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON generation_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON generation_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Input images table
CREATE TABLE input_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES generation_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    classification TEXT, -- 'product', 'avatar', 'other'
    description TEXT,
    order_index INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE input_images ENABLE ROW LEVEL SECURITY;

-- Input images policies
CREATE POLICY "Users can view own input images" ON input_images
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own input images" ON input_images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Generated images table
CREATE TABLE generated_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES generation_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    prompt_text TEXT,
    prompt_index INTEGER,
    platform TEXT, -- 'instagram', 'facebook', 'youtube'
    size TEXT, -- '1080x1920', '1080x1080', '2560x1440'
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- Generated images policies
CREATE POLICY "Users can view own generated images" ON generated_images
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own generated images" ON generated_images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Products table
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES generation_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_name TEXT NOT NULL,
    product_type TEXT,
    brand_name TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Users can view own products" ON products
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own products" ON products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Generation prompts table
CREATE TABLE generation_prompts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES generation_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    prompt_text TEXT NOT NULL,
    prompt_type TEXT,
    platform TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE generation_prompts ENABLE ROW LEVEL SECURITY;

-- Generation prompts policies
CREATE POLICY "Users can view own prompts" ON generation_prompts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own prompts" ON generation_prompts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usage logs table (track credit usage)
CREATE TABLE usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES generation_sessions(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'image_generation', 'image_classification', etc.
    credits_used INTEGER NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Usage logs policies
CREATE POLICY "Users can view own usage" ON usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own usage logs" ON usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_generation_sessions_user_id ON generation_sessions(user_id);
CREATE INDEX idx_generation_sessions_created_at ON generation_sessions(created_at DESC);
CREATE INDEX idx_input_images_session_id ON input_images(session_id);
CREATE INDEX idx_generated_images_session_id ON generated_images(session_id);
CREATE INDEX idx_products_session_id ON products(session_id);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at DESC);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
BEGIN
    INSERT INTO public.profiles (id, username, full_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update credits after usage
CREATE OR REPLACE FUNCTION update_user_credits()
RETURNS TRIGGER AS $
BEGIN
    UPDATE profiles
    SET credits_used = credits_used + NEW.credits_used
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger to update credits
CREATE TRIGGER on_usage_log_created
    AFTER INSERT ON usage_logs
    FOR EACH ROW EXECUTE FUNCTION update_user_credits();

-- Function to check if user has enough credits
CREATE OR REPLACE FUNCTION check_user_credits(user_id UUID, required_credits INTEGER)
RETURNS BOOLEAN AS $
DECLARE
    user_credits_total INTEGER;
    user_credits_used INTEGER;
BEGIN
    SELECT credits_total, credits_used INTO user_credits_total, user_credits_used
    FROM profiles
    WHERE id = user_id;
    
    RETURN (user_credits_total - user_credits_used) >= required_credits;
END;
$ LANGUAGE plpgsql;

-- View for user statistics
CREATE VIEW user_statistics AS
SELECT 
    p.id as user_id,
    p.username,
    p.plan,
    p.credits_total,
    p.credits_used,
    p.credits_total - p.credits_used as credits_remaining,
    COUNT(DISTINCT gs.id) as total_sessions,
    COUNT(DISTINCT gi.id) as total_images_generated,
    COUNT(DISTINCT pr.id) as total_products_scanned
FROM profiles p
LEFT JOIN generation_sessions gs ON gs.user_id = p.id
LEFT JOIN generated_images gi ON gi.user_id = p.id
LEFT JOIN products pr ON pr.user_id = p.id
GROUP BY p.id;

-- Grant access to the view
GRANT SELECT ON user_statistics TO authenticated;

-- Run this in your Supabase SQL Editor to create the storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('generated-images', 'generated-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('user-content', 'user-content', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for generated-images bucket
CREATE POLICY "Allow authenticated users to upload their own images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to view their own images" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow public to view generated images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'generated-images');

CREATE POLICY "Allow users to delete their own images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Set up RLS policies for user-content bucket
CREATE POLICY "Allow authenticated users to upload their own content" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-content' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to view their own content" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'user-content' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to update their own content" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'user-content' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own content" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'user-content' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

**Built with ❤️ using modern web technologies and AI**