import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { ArrowDown, ArrowUp, Loader2, Minus, Plus, Settings, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    keyword: "",
    url: "",
    location: "Brazil",
    targetPosition: 1,
  });

  const { data: keywords, isLoading: keywordsLoading, refetch: refetchKeywords } = trpc.keywords.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: summary, isLoading: summaryLoading } = trpc.rankings.getSummary.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createKeywordMutation = trpc.keywords.create.useMutation({
    onSuccess: () => {
      toast.success("Keyword adicionada com sucesso!");
      setIsAddDialogOpen(false);
      setFormData({ keyword: "", url: "", location: "Brazil", targetPosition: 1 });
      refetchKeywords();
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar keyword: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createKeywordMutation.mutate(formData);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Você precisa fazer login para acessar o dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Fazer Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">NeuroVendas SEO</h1>
            <p className="text-sm text-muted-foreground">Monitoramento de Rankings</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
            <div className="text-sm text-muted-foreground">
              {user?.name || user?.email}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-3xl font-bold">{summary?.totalKeywords || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Posição Média</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-3xl font-bold">{summary?.avgPosition || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowUp className="h-4 w-4 text-green-500" />
                Melhorias
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-3xl font-bold text-green-500">{summary?.improved || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-red-500" />
                Quedas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-3xl font-bold text-red-500">{summary?.declined || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Keywords List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Keywords Monitoradas</CardTitle>
                <CardDescription>Gerencie suas palavras-chave e acompanhe o ranking</CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Keyword
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Nova Keyword</DialogTitle>
                    <DialogDescription>
                      Adicione uma palavra-chave para monitorar seu ranking no Google
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="keyword">Palavra-chave</Label>
                      <Input
                        id="keyword"
                        placeholder="Ex: harmonização facial SP"
                        value={formData.keyword}
                        onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="url">URL do Conteúdo</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://seusite.com/blog/harmonizacao"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Localização</Label>
                      <Input
                        id="location"
                        placeholder="Brazil"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="targetPosition">Posição Alvo</Label>
                      <Input
                        id="targetPosition"
                        type="number"
                        min="1"
                        value={formData.targetPosition}
                        onChange={(e) => setFormData({ ...formData, targetPosition: parseInt(e.target.value) })}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={createKeywordMutation.isPending}>
                      {createKeywordMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adicionando...
                        </>
                      ) : (
                        "Adicionar Keyword"
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {keywordsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : keywords && keywords.length > 0 ? (
              <div className="space-y-4">
                {keywords.map((keyword) => (
                  <Link key={keyword.id} href={`/keyword/${keyword.id}`}>
                    <div className="p-4 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{keyword.keyword}</h3>
                          <p className="text-sm text-muted-foreground truncate">{keyword.url}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Localização</div>
                            <div className="font-medium">{keyword.location}</div>
                          </div>
                          <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma keyword adicionada</h3>
                <p className="text-muted-foreground mb-4">
                  Comece adicionando palavras-chave para monitorar
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Keyword
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
