import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, DollarSign, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Event } from './EventForm';

interface BudgetItem {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  supplier?: string;
  status: 'pending' | 'approved' | 'rejected' | 'purchased';
  created_at: string;
  updated_at: string;
}

interface BudgetManagerProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

const budgetCategories = [
  'alimentacao',
  'decoracao',
  'som_iluminacao',
  'equipamentos',
  'transporte',
  'pessoal',
  'marketing',
  'outros'
];

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

const statusColors = {
  pending: 'bg-accent/10 text-accent border-accent/20',
  approved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  purchased: 'bg-info/10 text-info border-info/20'
};

const statusLabels = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  purchased: 'Comprado'
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  purchased: DollarSign
};

export const BudgetManager = ({ event, isOpen, onClose }: BudgetManagerProps) => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('outros');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [supplier, setSupplier] = useState('');
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'purchased'>('pending');

  useEffect(() => {
    if (isOpen && event) {
      loadBudgetItems();
    }
  }, [isOpen, event]);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setDescription(editingItem.description || '');
      setCategory(editingItem.category);
      setQuantity(editingItem.quantity);
      setUnitPrice(editingItem.unit_price);
      setSupplier(editingItem.supplier || '');
      setStatus(editingItem.status);
    } else {
      resetForm();
    }
  }, [editingItem]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('outros');
    setQuantity(1);
    setUnitPrice(0);
    setSupplier('');
    setStatus('pending');
  };

  const loadBudgetItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBudgetItems((data || []) as BudgetItem[]);
    } catch (error) {
      console.error('Erro ao carregar itens do orçamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os itens do orçamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const itemData = {
        event_id: event.id,
        name: name.trim(),
        description: description.trim() || null,
        category,
        quantity,
        unit_price: unitPrice,
        supplier: supplier.trim() || null,
        status
      };

      if (editingItem) {
        const { error } = await supabase
          .from('budget_items')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Item do orçamento atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('budget_items')
          .insert([itemData]);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Item do orçamento criado com sucesso!",
        });
      }

      setIsFormOpen(false);
      setEditingItem(null);
      resetForm();
      await loadBudgetItems();
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o item do orçamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja excluir este item do orçamento?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('budget_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item do orçamento excluído com sucesso!",
      });
      
      await loadBudgetItems();
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o item do orçamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalBudget = budgetItems.reduce((sum, item) => sum + item.total_price, 0);
  const approvedBudget = budgetItems
    .filter(item => item.status === 'approved' || item.status === 'purchased')
    .reduce((sum, item) => sum + item.total_price, 0);
  const spentBudget = budgetItems
    .filter(item => item.status === 'purchased')
    .reduce((sum, item) => sum + item.total_price, 0);

  const openNewItemForm = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEditForm = (item: BudgetItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Orçamento - {event.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Resumo do Orçamento */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Orçamento Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    R$ {totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Aprovado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    R$ {approvedBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Gasto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-info">
                    R$ {spentBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Disponível
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">
                    R$ {(approvedBudget - spentBudget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controles */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Itens do Orçamento</h3>
              <Button onClick={openNewItemForm} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Item
              </Button>
            </div>

            {/* Tabela de Itens */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Preço Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum item no orçamento
                      </TableCell>
                    </TableRow>
                  ) : (
                    budgetItems.map((item) => {
                      const StatusIcon = statusIcons[item.status];
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              {item.description && (
                                <div className="text-sm text-muted-foreground">{item.description}</div>
                              )}
                              {item.supplier && (
                                <div className="text-xs text-muted-foreground">Fornecedor: {item.supplier}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {categoryLabels[item.category as keyof typeof categoryLabels]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            R$ {item.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            R$ {item.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[item.status]}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusLabels[item.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditForm(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Item' : 'Novo Item do Orçamento'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveItem} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Nome do Item*</Label>
              <Input
                id="item-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do item"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-description">Descrição</Label>
              <Textarea
                id="item-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição do item"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-category">Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryLabels[cat as keyof typeof categoryLabels]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-quantity">Quantidade*</Label>
                <Input
                  id="item-quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-price">Preço Unitário*</Label>
                <Input
                  id="item-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Total</Label>
                <div className="p-2 bg-muted rounded-md text-sm font-medium">
                  R$ {(quantity * unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-supplier">Fornecedor</Label>
              <Input
                id="item-supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Nome do fornecedor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-status">Status</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="purchased">Comprado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Salvando...' : (editingItem ? 'Atualizar' : 'Criar')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};