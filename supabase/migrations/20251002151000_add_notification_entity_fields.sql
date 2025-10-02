-- Add related_entity_id to notifications to store match_id, profile_id, etc.
ALTER TABLE public.notifications
ADD COLUMN related_entity_id uuid,
ADD COLUMN related_entity_type text;

-- Create index for performance
CREATE INDEX idx_notifications_related_entity ON public.notifications(related_entity_id);

-- Add comment to explain the fields
COMMENT ON COLUMN public.notifications.related_entity_id IS 'ID of the related entity (match_id, profile_id, etc.)';
COMMENT ON COLUMN public.notifications.related_entity_type IS 'Type of related entity (match, profile, etc.)';
