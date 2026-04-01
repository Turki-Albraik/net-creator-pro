CREATE POLICY "Anyone can insert routes" ON public.train_routes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update routes" ON public.train_routes FOR UPDATE USING (true);