import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, DollarSign, TrendingUp, TrendingDown, BarChart3, PieChart, FileText, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BudgetManager } from './BudgetManager';
import type { Event } from './EventForm';

interface BudgetItem {
  id: string;
  event_id: string;
  name: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: 'pending' | 'approved' | 'rejected' | 'purchased';
  created_at: string;
}

interface FinancialSummary {
  totalBudget: number;
  totalApproved: number;
  totalSpent: number;
  totalRemaining: number;
  itemCount: number;
  categoryBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
}

interface EventFinancial extends Event {
  budget_total?: number;
  financial_summary?: FinancialSummary;
}

export const FinancialModule = () => {
  const [events, setEvents] = useState<EventFinancial[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventFinancial | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [loading, setLoading] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [totalSummary, setTotalSummary] = useState<FinancialSummary>({
    totalBudget: 0,
    totalApproved: 0,
    totalSpent: 0,
    totalRemaining: 0,
    itemCount: 0,
    categoryBreakdown: {},
    statusBreakdown: {}
  });

  const categoryLabels = {
    alimentacao: 'Alimentação',
    decoracao: 'Decoração',
    som_iluminacao: 'Som e Iluminação',
    equipamentos: 'Equipamentos',
    transporte: 'Transporte',
    pessoal: 'Pessoal',
    marketing: 'Marketing',
    outros: 'Outros'
  };

  const statusLabels = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    purchased: 'Comprado'
  };

  useEffect(() => {
    loadFinancialData();
  }, [dateRange]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      // Carregar eventos no período
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('date', dateRange.from.toISOString())
        .lte('date', dateRange.to.toISOString())
        .order('date', { ascending: false });

      if (eventsError) throw eventsError;

      // Carregar itens de orçamento para cada evento
      const eventsWithFinancials = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { data: budgetItems, error: budgetError } = await supabase
            .from('budget_items')
            .select('*')
            .eq('event_id', event.id);

          if (budgetError) {
            console.error('Erro ao carregar orçamento do evento:', budgetError);
            return { ...event, financial_summary: createEmptySummary() };
          }

          const summary = calculateFinancialSummary((budgetItems || []) as BudgetItem[]);
          return { ...event, financial_summary: summary };
        })
      );

      setEvents(eventsWithFinancials as EventFinancial[]);

      // Calcular resumo total
      const allBudgetItems = eventsWithFinancials
        .flatMap(e => e.financial_summary)
        .filter(Boolean);
      
      const totalItems = await Promise.all(
        eventsWithFinancials.map(async (event) => {
          const { data: items } = await supabase
            .from('budget_items')
            .select('*')
            .eq('event_id', event.id);
          return items || [];
        })
      );

      const flatItems = totalItems.flat();
      setTotalSummary(calculateFinancialSummary(flatItems as BudgetItem[]));

    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados financeiros",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateFinancialSummary = (items: BudgetItem[]): FinancialSummary => {
    const totalBudget = items.reduce((sum, item) => sum + item.total_price, 0);
    const totalApproved = items
      .filter(item => item.status === 'approved' || item.status === 'purchased')
      .reduce((sum, item) => sum + item.total_price, 0);
    const totalSpent = items
      .filter(item => item.status === 'purchased')
      .reduce((sum, item) => sum + item.total_price, 0);

    const categoryBreakdown = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.total_price;
      return acc;
    }, {} as Record<string, number>);

    const statusBreakdown = items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + item.total_price;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalBudget,
      totalApproved,
      totalSpent,
      totalRemaining: totalApproved - totalSpent,
      itemCount: items.length,
      categoryBreakdown,
      statusBreakdown
    };
  };

  const createEmptySummary = (): FinancialSummary => ({
    totalBudget: 0,
    totalApproved: 0,
    totalSpent: 0,
    totalRemaining: 0,
    itemCount: 0,
    categoryBreakdown: {},
    statusBreakdown: {}
  });

  const openBudgetManager = (event: EventFinancial) => {
    setSelectedEvent(event);
    setIsBudgetOpen(true);
  };

  const handleDatePreset = (preset: string) => {
    const now = new Date();
    switch (preset) {
      case 'thisMonth':
        setDateRange({
          from: startOfMonth(now),
          to: endOfMonth(now)
        });
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        setDateRange({
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth)
        });
        break;
      case 'last3Months':
        setDateRange({
          from: startOfMonth(subMonths(now, 2)),
          to: endOfMonth(now)
        });
        break;
      case 'thisYear':
        setDateRange({
          from: new Date(now.getFullYear(), 0, 1),
          to: new Date(now.getFullYear(), 11, 31)
        });
        break;
    }
  };

  const generateReport = async () => {
    try {
      // Aqui implementaríamos a geração de relatório
      toast({
        title: "Relatório",
        description: "Funcionalidade de relatório será implementada em breve",
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Módulo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <Select onValueChange={handleDatePreset}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisMonth">Este Mês</SelectItem>
                <SelectItem value="lastMonth">Mês Passado</SelectItem>
                <SelectItem value="last3Months">Últimos 3 Meses</SelectItem>
                <SelectItem value="thisYear">Este Ano</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-32">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(dateRange.from, "dd/MM", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span className="self-center">até</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-32">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(dateRange.to, "dd/MM", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={generateReport} variant="outline" className="ml-auto">
              <Download className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Orçamento Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  R$ {totalSummary.totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalSummary.itemCount} itens
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Aprovado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  R$ {totalSummary.totalApproved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalSummary.totalBudget > 0 ? ((totalSummary.totalApproved / totalSummary.totalBudget) * 100).toFixed(1) : 0}% do total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Gasto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-info">
                  R$ {totalSummary.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalSummary.totalApproved > 0 ? ((totalSummary.totalSpent / totalSummary.totalApproved) * 100).toFixed(1) : 0}% do aprovado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Disponível
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">
                  R$ {totalSummary.totalRemaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Saldo restante
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {events.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum evento encontrado</h3>
                  <p className="text-muted-foreground">
                    Não há eventos no período selecionado
                  </p>
                </CardContent>
              </Card>
            ) : (
              events.map((event) => (
                <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{event.name}</CardTitle>
                      <Badge variant="outline">
                        {format(new Date(event.date), "dd/MM/yyyy", { locale: ptBR })}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Orçamento Total</p>
                        <p className="font-semibold text-primary">
                          R$ {(event.financial_summary?.totalBudget || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Gasto</p>
                        <p className="font-semibold text-info">
                          R$ {(event.financial_summary?.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => openBudgetManager(event)}
                      className="w-full"
                      variant="outline"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Gerenciar Orçamento
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(totalSummary.categoryBreakdown).map(([category, amount]) => (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {categoryLabels[category as keyof typeof categoryLabels] || category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-primary">
                    R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {totalSummary.totalBudget > 0 ? ((amount / totalSummary.totalBudget) * 100).toFixed(1) : 0}% do total
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Budget Manager Dialog */}
      {selectedEvent && (
        <BudgetManager
          event={selectedEvent}
          isOpen={isBudgetOpen}
          onClose={() => {
            setIsBudgetOpen(false);
            setSelectedEvent(null);
            loadFinancialData(); // Recarregar dados após fechar
          }}
        />
      )}
    </div>
  );
};