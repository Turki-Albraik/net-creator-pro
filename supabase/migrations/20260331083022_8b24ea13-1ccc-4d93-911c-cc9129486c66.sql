
-- Create employees table
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text UNIQUE NOT NULL,
  name text NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'employee',
  email text,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read employees (for login check)
CREATE POLICY "Anyone can view employees" ON public.employees
  FOR SELECT TO public USING (true);

-- Allow anyone to insert employees
CREATE POLICY "Anyone can insert employees" ON public.employees
  FOR INSERT TO public WITH CHECK (true);

-- Allow anyone to update employees
CREATE POLICY "Anyone can update employees" ON public.employees
  FOR UPDATE TO public USING (true);

-- Allow anyone to delete employees
CREATE POLICY "Anyone can delete employees" ON public.employees
  FOR DELETE TO public USING (true);

-- Seed staff user: ID=1, password=1, role=staff
INSERT INTO public.employees (employee_id, name, password, role)
VALUES ('1', 'Admin Staff', '1', 'staff');
