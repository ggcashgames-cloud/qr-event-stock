import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface PendingUser {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  role: 'admin' | 'financial_admin' | 'user';
  approved: boolean;
  created_at: string;
}

const UserApproval = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      loadPendingUsers();
    }
  }, [isAdmin]);

  const loadPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approved', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading pending users:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar usuários pendentes",
          variant: "destructive",
        });
        return;
      }

      setPendingUsers(data || []);
    } catch (error) {
      console.error('Error loading pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          approved: true,
          role: role as 'admin' | 'financial_admin' | 'user',
          approved_by: currentUser?.id,
          approved_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error approving user:', error);
        toast({
          title: "Erro",
          description: "Não foi possível aprovar o usuário",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Usuário aprovado",
        description: "O usuário foi aprovado com sucesso",
      });

      await loadPendingUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o usuário",
        variant: "destructive",
      });
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error rejecting user:', error);
        toast({
          title: "Erro",
          description: "Não foi possível rejeitar o usuário",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Usuário rejeitado",
        description: "O usuário foi rejeitado e removido do sistema",
      });

      await loadPendingUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o usuário",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Acesso negado. Apenas administradores podem aprovar usuários.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Carregando usuários pendentes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Aprovação de Usuários</h2>
        <p className="text-muted-foreground">
          Gerencie as solicitações de acesso ao sistema
        </p>
      </div>

      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum usuário pendente</h3>
              <p className="text-muted-foreground">
                Todos os usuários foram processados
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((user) => (
            <UserApprovalCard
              key={user.id}
              user={user}
              onApprove={handleApproveUser}
              onReject={handleRejectUser}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface UserApprovalCardProps {
  user: PendingUser;
  onApprove: (userId: string, role: string) => void;
  onReject: (userId: string) => void;
}

const UserApprovalCard = ({ user, onApprove, onReject }: UserApprovalCardProps) => {
  const [selectedRole, setSelectedRole] = useState<string>('user');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-muted rounded-full">
              <User className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">{user.name || 'Nome não informado'}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium">Nível de acesso:</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="financial_admin">Admin Financeiro</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReject(user.user_id)}
              className="text-destructive hover:text-destructive"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rejeitar
            </Button>
            <Button
              size="sm"
              onClick={() => onApprove(user.user_id, selectedRole)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Aprovar
            </Button>
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Solicitação enviada em: {new Date(user.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserApproval;