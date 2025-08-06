-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Anyone can view events" 
ON public.events 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create events" 
ON public.events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update events" 
ON public.events 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete events" 
ON public.events 
FOR DELETE 
USING (true);

-- Create event_products table to track products sent to events
CREATE TABLE public.event_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_sent INTEGER NOT NULL DEFAULT 1,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(event_id, product_id)
);

-- Enable RLS
ALTER TABLE public.event_products ENABLE ROW LEVEL SECURITY;

-- Create policies for event_products
CREATE POLICY "Anyone can view event products" 
ON public.event_products 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create event products" 
ON public.event_products 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update event products" 
ON public.event_products 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete event products" 
ON public.event_products 
FOR DELETE 
USING (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_event_products_event_id ON public.event_products(event_id);
CREATE INDEX idx_event_products_product_id ON public.event_products(product_id);
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_status ON public.events(status);