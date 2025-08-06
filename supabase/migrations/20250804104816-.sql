-- Create analysis_history table for storing news analysis results
CREATE TABLE public.analysis_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT,
  content_excerpt TEXT NOT NULL,
  analysis_result JSONB NOT NULL,
  source_verification JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to view analysis history (public data)
CREATE POLICY "Analysis history is publicly viewable" ON public.analysis_history
FOR SELECT USING (true);

-- Create policy to allow everyone to insert analysis history
CREATE POLICY "Anyone can add analysis history" ON public.analysis_history
FOR INSERT WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_analysis_history_updated_at BEFORE UPDATE
ON public.analysis_history FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();