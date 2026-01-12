import { Boxes, Activity } from 'lucide-react';

export default function EstoquePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Estoque</h1>
        <p className="text-sm text-muted-foreground">Controle de entradas, saídas e alertas de baixo estoque.</p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Boxes className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Visão geral</h2>
            <p className="text-sm text-muted-foreground">Quando integrado, trará inventário detalhado e movimentações.</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">
          <Activity className="h-4 w-4" />
          Placeholder para gráficos e alertas de estoque mínimo.
        </div>
      </div>
    </div>
  );
}
