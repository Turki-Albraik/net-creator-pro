
ALTER TABLE public.train_routes ADD COLUMN status text NOT NULL DEFAULT 'Active';

CREATE POLICY "Anyone can delete reservations" ON public.reservations FOR DELETE USING (true);
CREATE POLICY "Anyone can delete passengers" ON public.passengers FOR DELETE USING (true);
CREATE POLICY "Anyone can delete routes" ON public.train_routes FOR DELETE USING (true);
