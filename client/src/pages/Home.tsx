import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Bell, LineChart, TrendingUp, Zap } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">NeuroVendas SEO</h1>
              <p className="text-sm text-muted-foreground">Monitoramento de Rankings</p>
            </div>
            <Button asChild>
              <Link href="/dashboard">Ir para Dashboard</Link>
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-4xl font-bold mb-4">Bem-vindo de volta!</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Acesse seu dashboard para monitorar seus rankings
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard">Acessar Dashboard</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">NeuroVendas SEO</h1>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>Entrar</a>
          </Button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Monitore Seus Rankings no Google com Inteligência Artificial
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Acompanhe automaticamente a posição das suas palavras-chave, receba alertas inteligentes
              e tome decisões baseadas em dados para melhorar seu SEO.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg">
                <a href={getLoginUrl()}>Começar Gratuitamente</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#features">Ver Funcionalidades</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Funcionalidades Principais</h3>
            <p className="text-lg text-muted-foreground">
              Tudo que você precisa para dominar o SEO do seu negócio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Monitoramento Automático</CardTitle>
                <CardDescription>
                  Rastreamento semanal automático via Google Search Console. Seus rankings são atualizados
                  toda segunda-feira sem você precisar fazer nada.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <LineChart className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Histórico Completo</CardTitle>
                <CardDescription>
                  Visualize a evolução das suas posições ao longo do tempo com gráficos intuitivos
                  e dados detalhados de impressões, cliques e CTR.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Bell className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Alertas Inteligentes</CardTitle>
                <CardDescription>
                  Receba notificações automáticas via Slack ou Email quando houver mudanças significativas
                  nos seus rankings (melhorias ou quedas).
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Análise com IA</CardTitle>
                <CardDescription>
                  Insights e recomendações geradas por inteligência artificial para otimizar
                  sua estratégia de SEO baseadas nos dados reais.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Dashboard Completo</CardTitle>
                <CardDescription>
                  Visualize todas as suas métricas em um único lugar: posição média, melhorias,
                  quedas e keywords monitoradas.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <svg className="h-10 w-10 text-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <CardTitle>Automação n8n</CardTitle>
                <CardDescription>
                  Integração completa com n8n para automação avançada: coleta de dados,
                  análise e envio de relatórios.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20">
          <Card className="bg-gradient-to-r from-primary/10 to-blue-400/10 border-primary/20">
            <CardContent className="text-center py-12">
              <h3 className="text-3xl font-bold mb-4">Pronto para Melhorar Seu SEO?</h3>
              <p className="text-lg text-muted-foreground mb-8">
                Comece a monitorar seus rankings hoje mesmo e tome decisões baseadas em dados reais.
              </p>
              <Button asChild size="lg">
                <a href={getLoginUrl()}>Começar Agora - É Grátis</a>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 NeuroVendas SEO. Powered by Google Search Console & OpenAI.</p>
        </div>
      </footer>
    </div>
  );
}
