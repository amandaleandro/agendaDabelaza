'use client';

import { useState } from 'react';
import { 
  Settings, 
  CreditCard, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Shield,
  DollarSign
} from 'lucide-react';

interface EstablishmentConfig {
  // Dados do estabelecimento
  businessName: string;
  cnpj: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Dados de pagamento
  pixKey?: string;
  bankName?: string;
  accountType?: 'checking' | 'savings';
  accountNumber?: string;
  agencyNumber?: string;
  
  // Termos
  termsAccepted: boolean;
  termsAcceptedAt?: string;
}

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<EstablishmentConfig>({
    businessName: '',
    cnpj: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    termsAccepted: false,
  });

  const [activeTab, setActiveTab] = useState<'dados' | 'pagamento' | 'termos'>('dados');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Chamar endpoint PUT /establishments/config
      console.log('Configurações salvas:', config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (field: string, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  const handleAcceptTerms = () => {
    setConfig({
      ...config,
      termsAccepted: true,
      termsAcceptedAt: new Date().toISOString(),
    });
    setShowTerms(false);
  };

  const needsConfiguration = !config.businessName || !config.cnpj || !config.ownerEmail;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Configurações</h1>
          <p className="mt-1 text-sm text-slate-400">Gerencie os dados do seu estabelecimento e pagamento</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !config.termsAccepted}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Salvando...
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Salvo!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </button>
      </div>

      {/* Alert se não configurado */}
      {needsConfiguration && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-300 mb-1">Configuração Necessária</h3>
              <p className="text-sm text-yellow-200/80">
                Complete as informações do seu estabelecimento e aceite os termos para começar a usar o sistema.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'dados', label: 'Dados do Estabelecimento', icon: Building2 },
          { id: 'pagamento', label: 'Dados de Pagamento', icon: CreditCard },
          { id: 'termos', label: 'Termos e Contrato', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
        {activeTab === 'dados' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-400" />
                Informações do Estabelecimento
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome do Estabelecimento *</label>
                <input
                  type="text"
                  value={config.businessName}
                  onChange={(e) => updateConfig('businessName', e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Ex: Salão de Beleza Estrela"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">CNPJ *</label>
                <input
                  type="text"
                  value={config.cnpj}
                  onChange={(e) => updateConfig('cnpj', e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-400" />
                Dados do Responsável
              </h4>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome Completo *</label>
                <input
                  type="text"
                  value={config.ownerName}
                  onChange={(e) => updateConfig('ownerName', e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Nome do proprietário"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={config.ownerEmail}
                    onChange={(e) => updateConfig('ownerEmail', e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="tel"
                    value={config.ownerPhone}
                    onChange={(e) => updateConfig('ownerPhone', e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-indigo-400" />
                Endereço
              </h4>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Endereço Completo</label>
                <input
                  type="text"
                  value={config.address}
                  onChange={(e) => updateConfig('address', e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Cidade</label>
                  <input
                    type="text"
                    value={config.city}
                    onChange={(e) => updateConfig('city', e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Cidade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Estado</label>
                  <select
                    value={config.state}
                    onChange={(e) => updateConfig('state', e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Selecione</option>
                    <option value="SP">São Paulo</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="MG">Minas Gerais</option>
                    {/* Adicionar outros estados */}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">CEP</label>
                  <input
                    type="text"
                    value={config.zipCode}
                    onChange={(e) => updateConfig('zipCode', e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pagamento' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-indigo-400" />
                Dados para Recebimento
              </h3>
              <p className="text-sm text-slate-400">
                Configure como você deseja receber os pagamentos dos seus clientes
              </p>
            </div>

            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-indigo-400 mt-0.5" />
                <div className="text-sm text-slate-300">
                  <p className="font-medium mb-1">Seus dados estão seguros</p>
                  <p className="text-slate-400">Utilizamos criptografia de ponta a ponta para proteger suas informações bancárias.</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-3">PIX</h4>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Chave PIX</label>
                <input
                  type="text"
                  value={config.pixKey || ''}
                  onChange={(e) => updateConfig('pixKey', e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="CPF, CNPJ, Email ou Telefone"
                />
                <p className="mt-1.5 text-xs text-slate-500">Chave PIX para recebimentos rápidos</p>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6">
              <h4 className="text-sm font-semibold text-slate-300 mb-3">Dados Bancários (Opcional)</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Banco</label>
                  <input
                    type="text"
                    value={config.bankName || ''}
                    onChange={(e) => updateConfig('bankName', e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Nome do banco"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Tipo de Conta</label>
                    <select
                      value={config.accountType || ''}
                      onChange={(e) => updateConfig('accountType', e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">Selecione</option>
                      <option value="checking">Conta Corrente</option>
                      <option value="savings">Conta Poupança</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Agência</label>
                    <input
                      type="text"
                      value={config.agencyNumber || ''}
                      onChange={(e) => updateConfig('agencyNumber', e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Conta</label>
                    <input
                      type="text"
                      value={config.accountNumber || ''}
                      onChange={(e) => updateConfig('accountNumber', e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="00000-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'termos' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                Termos de Uso e Política
              </h3>
              <p className="text-sm text-slate-400">
                Leia e aceite os termos para começar a usar o sistema
              </p>
            </div>

            {config.termsAccepted ? (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-green-500/20 p-3">
                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-300 mb-1">Termos Aceitos</h4>
                    <p className="text-sm text-green-200/80 mb-2">
                      Você aceitou os termos em {config.termsAcceptedAt ? new Date(config.termsAcceptedAt).toLocaleString('pt-BR') : 'data desconhecida'}
                    </p>
                    <button
                      onClick={() => setShowTerms(true)}
                      className="text-sm text-green-300 hover:text-green-200 underline"
                    >
                      Ver termos completos
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6 max-h-96 overflow-y-auto">
                  <h4 className="font-bold text-white mb-4">Termos de Uso - Agendei</h4>
                  
                  <div className="space-y-4 text-sm text-slate-300">
                    <section>
                      <h5 className="font-semibold text-white mb-2">1. Aceitação dos Termos</h5>
                      <p className="text-slate-400 leading-relaxed">
                        Ao usar o sistema Agendei, você concorda com estes termos de uso. Se não concordar, não utilize o serviço.
                      </p>
                    </section>

                    <section>
                      <h5 className="font-semibold text-white mb-2">2. Descrição do Serviço</h5>
                      <p className="text-slate-400 leading-relaxed">
                        O Agendei é uma plataforma de agendamento online que conecta estabelecimentos a seus clientes,
                        facilitando o agendamento de serviços e gestão de horários.
                      </p>
                    </section>

                    <section>
                      <h5 className="font-semibold text-white mb-2">3. Responsabilidades do Usuário</h5>
                      <ul className="list-disc list-inside text-slate-400 space-y-1">
                        <li>Manter suas informações atualizadas e precisas</li>
                        <li>Proteger suas credenciais de acesso</li>
                        <li>Cumprir todas as leis e regulamentos aplicáveis</li>
                        <li>Não usar o serviço para fins ilegais ou não autorizados</li>
                      </ul>
                    </section>

                    <section>
                      <h5 className="font-semibold text-white mb-2">4. Pagamentos e Taxas</h5>
                      <p className="text-slate-400 leading-relaxed">
                        Os pagamentos são processados de forma segura. Taxas de serviço podem ser aplicadas conforme
                        o plano escolhido. Você será notificado sobre quaisquer mudanças nas taxas.
                      </p>
                    </section>

                    <section>
                      <h5 className="font-semibold text-white mb-2">5. Privacidade e Dados</h5>
                      <p className="text-slate-400 leading-relaxed">
                        Respeitamos sua privacidade. Os dados coletados são usados apenas para fornecimento do serviço
                        e nunca serão vendidos a terceiros. Consulte nossa Política de Privacidade para mais detalhes.
                      </p>
                    </section>

                    <section>
                      <h5 className="font-semibold text-white mb-2">6. Cancelamento</h5>
                      <p className="text-slate-400 leading-relaxed">
                        Você pode cancelar sua assinatura a qualquer momento. Após o cancelamento, o acesso será
                        mantido até o fim do período pago.
                      </p>
                    </section>

                    <section>
                      <h5 className="font-semibold text-white mb-2">7. Limitação de Responsabilidade</h5>
                      <p className="text-slate-400 leading-relaxed">
                        O Agendei não se responsabiliza por danos indiretos, perda de dados ou lucros cessantes.
                        O serviço é fornecido "como está".
                      </p>
                    </section>

                    <section>
                      <h5 className="font-semibold text-white mb-2">8. Modificações</h5>
                      <p className="text-slate-400 leading-relaxed">
                        Reservamos o direito de modificar estes termos a qualquer momento. Você será notificado
                        sobre mudanças significativas.
                      </p>
                    </section>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={handleAcceptTerms}
                      className="mt-1 rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="text-sm text-slate-300">
                      Li e concordo com os <strong className="text-white">Termos de Uso</strong> e com a{' '}
                      <strong className="text-white">Política de Privacidade</strong> do Agendei.
                    </span>
                  </label>
                </div>

                <button
                  onClick={handleAcceptTerms}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  Aceitar Termos e Continuar
                </button>
              </div>
            )}

            {showTerms && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-800">
                  <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6">
                    <h3 className="text-xl font-bold text-white">Termos de Uso Completos</h3>
                  </div>
                  <div className="p-6">
                    {/* Conteúdo dos termos aqui */}
                    <p className="text-slate-400">Termos completos...</p>
                  </div>
                  <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-6">
                    <button
                      onClick={() => setShowTerms(false)}
                      className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
