import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Settings() {
  const { isAuthenticated, logout } = useAuth();

  const { data: gscStatus, isLoading: gscLoading, refetch: refetchGscStatus } = trpc.gsc.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: authUrlData } = trpc.gsc.getAuthUrl.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const disconnectMutation = trpc.gsc.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Google Search Console desconectado com sucesso!");
      refetchGscStatus();
    },
    onError: (error) => {
      toast.error(`Erro ao desconectar: ${error.message}`);
    },
  });

  const handleConnect = () => {
    if (authUrlData?.authUrl) {
      window.location.href = authUrlData.authUrl;
    } else {
      toast.error("URL de autenticação não disponível");
    }
  };

  const handleDisconnect = () => {
    if (confirm("Tem certeza que deseja desconectar o Google Search Console?")) {
      disconnectMutation.mutate();
    }
  };

  if (gscLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
            <p className="text-sm text-muted-foreground">Gerencie suas integrações e preferências</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Google Search Console */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Google Search Console</CardTitle>
            <CardDescription>
              Conecte sua conta do Google Search Console para monitorar rankings automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gscStatus?.connected ? (
                <>
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Conectado</span>
                  </div>
                  {gscStatus.siteUrl && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Site:</span> {gscStatus.siteUrl}
                    </div>
                  )}
                  {gscStatus.expiresAt && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Expira em:</span>{" "}
                      {new Date(gscStatus.expiresAt).toLocaleDateString("pt-BR")}
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                    disabled={disconnectMutation.isPending}
                  >
                    {disconnectMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Desconectando...
                      </>
                    ) : (
                      "Desconectar"
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Não conectado</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Para começar a monitorar seus rankings, conecte sua conta do Google Search Console.
                    Você precisará autorizar o acesso aos dados de busca do seu site.
                  </p>
                  <Button onClick={handleConnect}>
                    Conectar Google Search Console
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
            <CardDescription>
              Configure como você deseja receber notificações sobre mudanças de ranking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Os alertas são enviados automaticamente quando detectadas mudanças significativas:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Melhoria de 3+ posições</li>
                  <li>Queda de 3+ posições</li>
                  <li>Keyword atingiu posição alvo</li>
                </ul>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Nota:</span> Configure os webhooks do Slack e Email no fluxo n8n
                para receber notificações.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conta */}
        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
            <CardDescription>Gerencie sua conta e sessão</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => logout()}>
              Sair da Conta
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
