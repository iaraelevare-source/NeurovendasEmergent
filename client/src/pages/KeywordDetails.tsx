import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { Link, useParams } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function KeywordDetails() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const keywordId = parseInt(id || "0");

  const { data: keyword, isLoading: keywordLoading } = trpc.keywords.getById.useQuery(
    { id: keywordId },
    { enabled: isAuthenticated && keywordId > 0 }
  );

  const { data: rankings, isLoading: rankingsLoading } = trpc.rankings.getHistory.useQuery(
    { keywordId, limit: 12 },
    { enabled: isAuthenticated && keywordId > 0 }
  );

  if (keywordLoading || rankingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!keyword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Keyword não encontrada</CardTitle>
            <CardDescription>A keyword que você está procurando não existe</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard">Voltar ao Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data (reverse to show oldest first)
  const chartData = rankings
    ? [...rankings].reverse().map((r) => ({
        date: r.date,
        position: r.position || 100, // Use 100 if no position (not ranked)
      }))
    : [];

  const latestRanking = rankings && rankings.length > 0 ? rankings[0] : null;

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
            <h1 className="text-2xl font-bold text-foreground">{keyword.keyword}</h1>
            <p className="text-sm text-muted-foreground">{keyword.url}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Current Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Posição Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {latestRanking?.position || "N/A"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Mudança</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {latestRanking?.changeType === "up" && (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="text-3xl font-bold text-green-500">
                      +{Math.abs(latestRanking.change || 0)}
                    </span>
                  </>
                )}
                {latestRanking?.changeType === "down" && (
                  <>
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    <span className="text-3xl font-bold text-red-500">
                      {latestRanking.change || 0}
                    </span>
                  </>
                )}
                {(!latestRanking || latestRanking.changeType === "stable") && (
                  <span className="text-3xl font-bold text-muted-foreground">0</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Impressões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {latestRanking?.impressions || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cliques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {latestRanking?.clicks || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Histórico de Ranking (Últimas 12 Semanas)</CardTitle>
            <CardDescription>Acompanhe a evolução da posição no Google</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    reversed
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    label={{ value: "Posição", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="position"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Ainda não há dados de ranking para esta keyword.
                  <br />
                  Os dados serão coletados automaticamente toda segunda-feira.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rankings History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico Detalhado</CardTitle>
            <CardDescription>Dados semanais de performance</CardDescription>
          </CardHeader>
          <CardContent>
            {rankings && rankings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Posição</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Mudança</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Impressões</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cliques</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((ranking) => (
                      <tr key={ranking.id} className="border-b border-border hover:bg-accent">
                        <td className="py-3 px-4 text-sm">{ranking.date}</td>
                        <td className="py-3 px-4 text-sm font-medium">
                          {ranking.position || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-1">
                            {ranking.changeType === "up" && (
                              <>
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                <span className="text-green-500">+{Math.abs(ranking.change || 0)}</span>
                              </>
                            )}
                            {ranking.changeType === "down" && (
                              <>
                                <TrendingDown className="h-4 w-4 text-red-500" />
                                <span className="text-red-500">{ranking.change || 0}</span>
                              </>
                            )}
                            {ranking.changeType === "stable" && (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{ranking.impressions}</td>
                        <td className="py-3 px-4 text-sm">{ranking.clicks}</td>
                        <td className="py-3 px-4 text-sm">{ranking.ctr}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum dado disponível ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
