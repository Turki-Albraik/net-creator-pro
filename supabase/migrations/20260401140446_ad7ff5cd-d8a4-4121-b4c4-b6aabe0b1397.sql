
-- Create passengers table
CREATE TABLE public.passengers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  trips INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view passengers" ON public.passengers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert passengers" ON public.passengers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update passengers" ON public.passengers FOR UPDATE USING (true);

-- Update existing employee role
UPDATE public.employees SET role = 'Railway Administrator' WHERE employee_id = '1';
