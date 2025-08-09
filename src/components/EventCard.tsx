import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Edit, Trash2, Package, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Event } from './EventForm';
interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
  onViewProducts: (event: Event) => void;
  onManageBudget?: (event: Event) => void;
  productCount?: number;
}
const statusColors = {
  planned: 'bg-blue-100 text-blue-800 border-blue-300',
  active: 'bg-green-100 text-green-800 border-green-300',
  completed: 'bg-gray-100 text-gray-800 border-gray-300'
};
const statusLabels = {
  planned: 'Planejado',
  active: 'Ativo',
  completed: 'Concluído'
};
export const EventCard = ({
  event,
  onEdit,
  onDelete,
  onViewProducts,
  onManageBudget,
  productCount = 0
}: EventCardProps) => {
  return <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2">{event.name}</CardTitle>
          <Badge variant="outline" className={statusColors[event.status]}>
            {statusLabels[event.status]}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-3">
        {event.description && <p className="text-sm text-muted-foreground line-clamp-3">
            {event.description}
          </p>}
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(event.date), "PPP", {
              locale: ptBR
            })}</span>
          </div>
          
          {event.location && <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="line-clamp-1">{event.location}</span>
            </div>}
          
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>{productCount} {productCount === 1 ? 'produto' : 'produtos'}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-3 py-[14px] px-0">
        <div className="flex gap-1 w-full">
          <Button variant="outline" size="sm" onClick={() => onViewProducts(event)} className="flex-1">
            <Package className="h-4 w-4 mr-1" />
            Produtos
          </Button>
          {onManageBudget && <Button variant="outline" size="sm" onClick={() => onManageBudget(event)} className="flex-1">
              <DollarSign className="h-4 w-4 mr-1" />
              Orçamento
            </Button>}
          <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(event.id)} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>;
};