-- Criar tabela para itens de orçamento detalhados
CREATE TABLE public.budget_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'outros',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_price NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  supplier TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'purchased')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- Políticas para itens de orçamento
CREATE POLICY "Admins and financial admins can view all budget items"
ON public.budget_items 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'financial_admin'::user_role));

CREATE POLICY "Admins and financial admins can create budget items"
ON public.budget_items 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'financial_admin'::user_role));

CREATE POLICY "Admins and financial admins can update budget items"
ON public.budget_items 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'financial_admin'::user_role));

CREATE POLICY "Admins and financial admins can delete budget items"
ON public.budget_items 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'financial_admin'::user_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_budget_items_updated_at
BEFORE UPDATE ON public.budget_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela para relatórios financeiros
CREATE TABLE public.financial_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('budget', 'expense', 'summary')),
  title TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_budget NUMERIC(12,2) DEFAULT 0.00,
  total_spent NUMERIC(12,2) DEFAULT 0.00,
  total_remaining NUMERIC(12,2) GENERATED ALWAYS AS (total_budget - total_spent) STORED,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS para relatórios
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;

-- Políticas para relatórios financeiros
CREATE POLICY "Admins and financial admins can manage financial reports"
ON public.financial_reports 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'financial_admin'::user_role));

-- Trigger para atualizar updated_at nos relatórios
CREATE TRIGGER update_financial_reports_updated_at
BEFORE UPDATE ON public.financial_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para performance
CREATE INDEX idx_budget_items_event_id ON public.budget_items(event_id);
CREATE INDEX idx_budget_items_status ON public.budget_items(status);
CREATE INDEX idx_budget_items_category ON public.budget_items(category);
CREATE INDEX idx_financial_reports_event_id ON public.financial_reports(event_id);
CREATE INDEX idx_financial_reports_period ON public.financial_reports(period_start, period_end);