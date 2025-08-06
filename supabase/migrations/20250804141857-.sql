-- Create a table to track triggered alerts
CREATE TABLE public.triggered_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_id UUID NOT NULL,
  analysis_id UUID NOT NULL,
  content_excerpt TEXT NOT NULL,
  matched_keywords TEXT[] NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.triggered_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own triggered alerts" 
ON public.triggered_alerts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create triggered alerts" 
ON public.triggered_alerts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own triggered alerts" 
ON public.triggered_alerts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own triggered alerts" 
ON public.triggered_alerts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_triggered_alerts_user_id ON public.triggered_alerts(user_id);
CREATE INDEX idx_triggered_alerts_triggered_at ON public.triggered_alerts(triggered_at DESC);