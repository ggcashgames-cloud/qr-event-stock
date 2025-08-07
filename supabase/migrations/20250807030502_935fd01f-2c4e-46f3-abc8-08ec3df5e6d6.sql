-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('admin', 'financial_admin', 'user');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role user_role DEFAULT 'user',
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'financial_admin')
    AND approved = true
  )
);

CREATE POLICY "Admins can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'financial_admin')
    AND approved = true
  )
);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add price column to products
ALTER TABLE public.products 
ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00;

-- Remove min_stock column from products
ALTER TABLE public.products 
DROP COLUMN IF EXISTS min_stock;

-- Add budget fields to events
ALTER TABLE public.events 
ADD COLUMN budget_total DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN budget_items JSONB DEFAULT '[]'::jsonb;

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND role = _role
      AND approved = true
  )
$$;

-- Create function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT approved FROM public.profiles WHERE user_id = _user_id), 
    false
  )
$$;

-- Update products RLS policies for admin-only creation
DROP POLICY IF EXISTS "Anyone can create products" ON public.products;
CREATE POLICY "Only admins can create products" 
ON public.products 
FOR INSERT 
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'financial_admin')
);

-- Update events policies for budget access
CREATE POLICY "Only financial admins can view budget info" 
ON public.events 
FOR SELECT 
USING (
  CASE 
    WHEN budget_total > 0 OR budget_items != '[]'::jsonb THEN
      public.has_role(auth.uid(), 'admin') OR 
      public.has_role(auth.uid(), 'financial_admin')
    ELSE 
      true
  END
);

-- Create trigger for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();