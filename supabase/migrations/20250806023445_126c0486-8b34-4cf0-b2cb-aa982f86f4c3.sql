-- Create products table for stock management
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no auth is implemented yet)
CREATE POLICY "Anyone can view products" 
ON public.products 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create products" 
ON public.products 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update products" 
ON public.products 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete products" 
ON public.products 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert demo data
INSERT INTO public.products (name, category, quantity, min_stock, description, qr_code) VALUES
('Mesa Redonda 1.5m', 'Mobiliário', 15, 5, 'Mesa redonda para 8 pessoas', 'MESA-001'),
('Refletor LED 50W', 'Iluminação', 3, 5, 'Refletor LED branco quente', 'LED-001'),
('Caixa de Som Ativa', 'Som e Áudio', 8, 3, 'Caixa ativa 500W RMS', 'SOM-001');