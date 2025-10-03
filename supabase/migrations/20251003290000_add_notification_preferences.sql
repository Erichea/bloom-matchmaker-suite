-- Add notification preferences for users
-- This table stores user preferences for different notification channels

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Channel preferences
  push_enabled boolean NOT NULL DEFAULT false,
  email_enabled boolean NOT NULL DEFAULT true,
  sms_enabled boolean NOT NULL DEFAULT false,

  -- Notification type preferences (granular control)
  match_notifications boolean NOT NULL DEFAULT true,
  profile_notifications boolean NOT NULL DEFAULT true,
  message_notifications boolean NOT NULL DEFAULT true,
  system_notifications boolean NOT NULL DEFAULT true,

  -- Push subscription data (for cleanup/debugging)
  push_subscription jsonb,
  push_subscribed_at timestamp with time zone,

  -- Metadata
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  -- Ensure one preference row per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only manage their own preferences
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notification preferences"
  ON public.notification_preferences
  FOR DELETE
  USING (user_id = auth.uid());

-- Admins can view all preferences (for debugging)
CREATE POLICY "Admins can view all notification preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_push_enabled ON public.notification_preferences(push_enabled) WHERE push_enabled = true;

-- Trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

-- Function to get or create user preferences
CREATE OR REPLACE FUNCTION public.get_notification_preferences(p_user_id uuid)
RETURNS public.notification_preferences AS $$
DECLARE
  v_preferences public.notification_preferences;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO v_preferences
  FROM public.notification_preferences
  WHERE user_id = p_user_id;

  -- If none exist, create default preferences
  IF v_preferences IS NULL THEN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;

  RETURN v_preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_notification_preferences(uuid) TO authenticated;
