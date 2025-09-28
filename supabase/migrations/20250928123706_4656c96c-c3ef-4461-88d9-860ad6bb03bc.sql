-- Create enum types for better data integrity
CREATE TYPE profile_status AS ENUM ('incomplete', 'pending_approval', 'approved', 'rejected');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say');
CREATE TYPE education_level AS ENUM ('high_school', 'bachelor', 'master', 'phd', 'other');
CREATE TYPE relationship_status AS ENUM ('single', 'divorced', 'widowed', 'separated');
CREATE TYPE income_level AS ENUM ('under_50k', '50k_75k', '75k_100k', '100k_150k', '150k_plus');

-- Create access codes table for event tracking
CREATE TABLE public.access_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  event_name VARCHAR(255),
  event_date DATE,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create profiles table for client information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_code_id UUID REFERENCES access_codes(id),
  
  -- Basic Information
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  date_of_birth DATE,
  gender gender_type,
  height_cm INTEGER,
  weight_kg INTEGER,
  
  -- Location
  country VARCHAR(100),
  city VARCHAR(100),
  nationality VARCHAR(100),
  
  -- Personal Information
  profession VARCHAR(255),
  education education_level,
  income_level income_level,
  relationship_status relationship_status,
  faith VARCHAR(100),
  number_of_children INTEGER DEFAULT 0,
  wants_more_children BOOLEAN,
  
  -- Profile Content
  about_me TEXT,
  achievements TEXT,
  interests TEXT[],
  lifestyle TEXT[],
  
  -- Preferences
  preferred_gender gender_type,
  preferred_min_age INTEGER,
  preferred_max_age INTEGER,
  preferred_min_height INTEGER,
  preferred_max_height INTEGER,
  preferred_location_radius INTEGER,
  seeks_similar_values BOOLEAN DEFAULT TRUE,
  
  -- System Fields
  status profile_status DEFAULT 'incomplete',
  completion_percentage INTEGER DEFAULT 0,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profile photos table
CREATE TABLE public.profile_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  compatibility_score INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  profile_1_response VARCHAR(50), -- 'accepted', 'rejected', 'pending'
  profile_2_response VARCHAR(50),
  rejection_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_1_id, profile_2_id)
);

-- Create match interactions table for tracking communication
CREATE TABLE public.match_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50), -- 'contact_shared', 'date_scheduled', 'date_completed', 'feedback_given'
  interaction_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles table for admin access
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'client', -- 'admin', 'client'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for access_codes
CREATE POLICY "Admins can manage access codes" ON public.access_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for profile_photos
CREATE POLICY "Users can manage their own photos" ON public.profile_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = profile_photos.profile_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all photos" ON public.profile_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for matches
CREATE POLICY "Users can view their own matches" ON public.matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE (id = matches.profile_1_id OR id = matches.profile_2_id) 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all matches" ON public.matches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles existing_role
      WHERE existing_role.user_id = auth.uid() AND existing_role.role = 'admin'
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
  completion_score INTEGER := 0;
  total_fields INTEGER := 20;
  profile_record public.profiles%ROWTYPE;
  photo_count INTEGER;
BEGIN
  SELECT * INTO profile_record FROM public.profiles WHERE id = profile_id;
  
  -- Check required fields (1 point each)
  IF profile_record.first_name IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.last_name IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.email IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.date_of_birth IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.gender IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.country IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.city IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.profession IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.education IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.relationship_status IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.about_me IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.preferred_gender IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.preferred_min_age IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.preferred_max_age IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.height_cm IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.nationality IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.faith IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.income_level IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.wants_more_children IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  
  -- Check for photos (minimum 1 required)
  SELECT COUNT(*) INTO photo_count FROM public.profile_photos WHERE profile_photos.profile_id = profile_id;
  IF photo_count > 0 THEN completion_score := completion_score + 1; END IF;
  
  RETURN (completion_score * 100 / total_fields);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically update completion percentage
CREATE OR REPLACE FUNCTION public.update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.completion_percentage := public.calculate_profile_completion(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profile_completion_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_completion();

-- Insert some sample access codes
INSERT INTO public.access_codes (code, event_name, event_date, expires_at) VALUES
  ('LONDON2024', 'London Singles Event', '2024-03-15', '2024-06-15'),
  ('PARIS2024', 'Paris Networking Event', '2024-04-20', '2024-07-20'),
  ('NYC2024', 'New York Professional Mixer', '2024-05-10', '2024-08-10');