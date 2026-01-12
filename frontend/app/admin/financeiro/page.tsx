import { BarChart3, PiggyBank } from 'lucide-react';

export default function FinanceiroPage() {
  const insights = [
    {
      title: 'Receita vs. Despesa',
      description: 'Indicadores e gráficos ficarão disponíveis assim que a API financeira estiver pronta.',
      icon: BarChart3,
    },
    {
      title: 'Caixa',
      description: 'Resumo diário e projeção futura de caixa entram aqui.',
      icon: PiggyBank,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Resumo executivo da saúde financeira.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((card) => (
          <div key={card.title} className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <card.icon className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">{card.title}</h2>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </div>
            </div>
            <div className="mt-4 rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">
              Este é um placeholder. Conecte com endpoints de faturamento e despesas quando disponíveis.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
