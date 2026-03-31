
-- Train routes table
CREATE TABLE public.train_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  train_id text NOT NULL,
  source text NOT NULL,
  destination text NOT NULL,
  distance_km integer NOT NULL,
  price_per_ticket numeric(10,2) NOT NULL,
  departure_time time NOT NULL,
  arrival_time time NOT NULL,
  total_seats integer NOT NULL DEFAULT 40,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Reservations table
CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id text NOT NULL UNIQUE,
  passenger_name text NOT NULL,
  passenger_email text,
  passenger_phone text,
  route_id uuid REFERENCES public.train_routes(id) ON DELETE CASCADE NOT NULL,
  travel_date date NOT NULL,
  seat_numbers text[] NOT NULL,
  num_tickets integer NOT NULL DEFAULT 1,
  total_amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'Confirmed',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.train_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Public read access for routes
CREATE POLICY "Anyone can view routes" ON public.train_routes FOR SELECT USING (true);

-- Public access for reservations (no auth yet)
CREATE POLICY "Anyone can view reservations" ON public.reservations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reservations" ON public.reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update reservations" ON public.reservations FOR UPDATE USING (true);
