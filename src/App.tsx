/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  Layers, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Menu, 
  X, 
  Moon, 
  Sun, 
  ChevronDown, 
  FileSpreadsheet, 
  LogOut, 
  Bell, 
  Percent, 
  Car, 
  Tag, 
  ArrowUpRight, 
  ArrowDownRight,
  Info,
  Shield,
  Lightbulb,
  Camera,
  Eye,
  Settings,
  HelpCircle,
  TrendingDown,
  Edit2,
  BookOpen,
  Target,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- SISTEMA LIMPO: SEM DADOS DE TESTE INICIAIS ---
const INITIAL_EXPENSES = [];

const METAS_FINANCEIRAS = {
  mensal: 0,
  atual: 0,
};

const CATEGORIES = [
  'Alimentação',
  'Combustível',
  'Hospedagem',
  'Pedágio',
  'Manutenção',
  'Ferramentas',
  'Materiais',
  'Emergências',
  'Transporte',
  'Outros'
];

const PAYMENTS = [
  'Cartão Corporativo',
  'Reembolso',
  'Dinheiro',
  'Faturamento Direto',
  'Sem Parar / Corporativo'
];

const COST_CENTERS = [
  'Comercial - 102',
  'Operações - 304',
  'Auditoria - 401',
  'Diretoria - 101',
  'TI & Infraestrutura - 202'
];

export default function App() {
  // --- ESTADOS DE USUÁRIO ÚNICO ---
  const [userData, setUserData] = useState({
    fullName: '',
    cpf: '',
    rg: '',
    jobTitle: ''
  });
  const [showNameModal, setShowNameModal] = useState(false);
  const [editUserData, setEditUserData] = useState({
    fullName: '',
    cpf: '',
    rg: '',
    jobTitle: '',
    initialBudget: ''
  });
  const [isEditingName, setIsEditingName] = useState(false);

  // --- ESTADOS DO SISTEMA ---
  const [budget, setBudget] = useState<number>(0);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [expenses, setExpenses] = useState<any[]>(INITIAL_EXPENSES);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | despesas | cadastrar | insights | painel-gestor
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: string} | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  // --- ESTADO DO GUIA PASSO A PASSO ---
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  // --- ESTADOS DE FILTRO ---
  const [filterSearch, setFilterSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterUser, setFilterUser] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterPeriod, setFilterPeriod] = useState('Mês Selecionado'); // 'Mês Selecionado' | 'Todo o período'
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterCity, setFilterCity] = useState('Todas');

  // --- ESTADO DO NOVO CADASTRO ---
  const [newExpense, setNewExpense] = useState({
    productName: '',
    category: 'Alimentação',
    amount: '',
    quantity: '1',
    paymentMethod: 'Cartão Corporativo',
    vendor: '',
    city: '',
    state: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    notes: '',
    costCenter: 'Comercial - 102',
    travelNumber: '',
    km: '0',
    expenseType: 'Viagem Nacional',
    receiptName: '',
    status: 'Aprovado' 
  });

  // --- VERIFICAÇÃO INICIAL DO USUÁRIO & ORÇAMENTO ---
  useEffect(() => {
    const savedUser = localStorage.getItem('controle_viagens_user_data_v2');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUserData(parsed);
    } else {
      setShowNameModal(true);
    }

    const savedBudget = localStorage.getItem('controle_viagens_budget_v2');
    if (savedBudget) {
      setBudget(parseFloat(savedBudget));
    } else {
      setBudget(0);
    }
  }, []);
  
  // --- INTELLIGENCE: AUTO-LOOKUP STATE FROM CITY ---
  useEffect(() => {
    if (newExpense.city.length > 3) {
      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch('/api/get-state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city: newExpense.city })
          });
          if (response.ok) {
            const data = await response.json();
            if (data.state && data.state.length === 2) {
              setNewExpense(prev => ({ ...prev, state: data.state.toUpperCase() }));
            }
          }
        } catch (error) {
          console.error("Auto-lookup state error:", error);
        }
      }, 1200); 
      return () => clearTimeout(timeoutId);
    }
  }, [newExpense.city]);

  // --- NOTIFICAÇÃO HELPER ---
  const showToast = (message: string, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- CURRENCY FORMATTING UTILS ---
  const formatCurrency = (value: string) => {
    if (!value) return '';
    // Limpar tudo que não é número
    const cleanValue = value.replace(/\D/g, '');
    const numberValue = parseFloat(cleanValue) / 100;
    
    if (isNaN(numberValue)) return '';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numberValue);
  };

  const parseCurrencyToNumber = (formattedValue: string) => {
    if (!formattedValue) return 0;
    return parseFloat(formattedValue.replace(/\D/g, '')) / 100;
  };

  // --- SALVAR DADOS INICIAIS ---
  const handleSaveInitialName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserData.fullName || !editUserData.cpf || !editUserData.jobTitle || !editUserData.initialBudget) {
      showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }
    const initialBudgetVal = parseCurrencyToNumber(editUserData.initialBudget);
    setBudget(initialBudgetVal);
    localStorage.setItem('controle_viagens_budget_v2', initialBudgetVal.toString());

    const finalUserData = {
      fullName: editUserData.fullName,
      cpf: editUserData.cpf,
      rg: editUserData.rg,
      jobTitle: editUserData.jobTitle
    };
    setUserData(finalUserData);
    localStorage.setItem('controle_viagens_user_data_v2', JSON.stringify(finalUserData));
    setShowNameModal(false);
    showToast(`Seja bem-vindo, ${editUserData.fullName.split(' ')[0]}!`, 'success');
  };

  // --- EDITAR PERFIL SALVO ---
  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserData.fullName || !editUserData.cpf || !editUserData.jobTitle) {
      showToast('Campos obrigatórios não podem ficar vazios.', 'error');
      return;
    }
    setUserData(editUserData);
    localStorage.setItem('controle_viagens_user_data_v2', JSON.stringify(editUserData));
    setIsEditingName(false);
    showToast('Perfil atualizado com sucesso!', 'success');
  };

  const handleUpdateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const newBudget = parseCurrencyToNumber(budgetInput);
    if (newBudget <= 0) {
      showToast('O orçamento deve ser maior que zero.', 'error');
      return;
    }
    setBudget(newBudget);
    localStorage.setItem('controle_viagens_budget_v2', newBudget.toString());
    setIsEditingBudget(false);
    showToast('Orçamento atualizado com sucesso!', 'success');
  };

  // --- FILTRAGEM DOS DADOS ---
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const searchMatch = 
        exp.productName.toLowerCase().includes(filterSearch.toLowerCase()) ||
        exp.vendor.toLowerCase().includes(filterSearch.toLowerCase()) ||
        exp.travelNumber.toLowerCase().includes(filterSearch.toLowerCase()) ||
        exp.id.toLowerCase().includes(filterSearch.toLowerCase());

      const categoryMatch = filterCategory === 'Todas' || exp.category === filterCategory;
      const userMatch = filterUser === 'Todos' || exp.responsible === filterUser;
      const statusMatch = filterStatus === 'Todos' || exp.status === filterStatus;
      const cityMatch = filterCity === 'Todas' || exp.city === filterCity;
      const minMatch = !filterMinAmount || exp.amount >= parseFloat(filterMinAmount);
      const maxMatch = !filterMaxAmount || exp.amount <= parseFloat(filterMaxAmount);

      let periodMatch = true;
      const expDate = new Date(exp.date + 'T00:00:00');
      
      if (filterPeriod === 'Mês Selecionado') {
        periodMatch = expDate.getMonth() === filterMonth && expDate.getFullYear() === filterYear;
      } else if (filterPeriod === 'Hoje') {
        const today = new Date();
        periodMatch = exp.date === today.toISOString().split('T')[0];
      } else if (filterPeriod === 'Semana') {
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        periodMatch = expDate >= oneWeekAgo;
      }

      return searchMatch && categoryMatch && userMatch && statusMatch && cityMatch && minMatch && maxMatch && periodMatch;
    });
  }, [expenses, filterSearch, filterCategory, filterUser, filterStatus, filterPeriod, filterMinAmount, filterMaxAmount, filterCity, filterMonth, filterYear]);

  // --- CÁLCULO DE MÉTRICAS ---
  const metrics = useMemo(() => {
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const count = filteredExpenses.length;
    const average = count > 0 ? total / count : 0;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const totalToday = expenses
      .filter(exp => exp.date === todayStr)
      .reduce((sum, exp) => sum + exp.amount, 0);

    const totalMonth = expenses
      .filter(exp => {
        const d = new Date(exp.date + 'T00:00:00');
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      })
      .reduce((sum, exp) => sum + exp.amount, 0);

    const totalYear = expenses
      .reduce((sum, exp) => sum + exp.amount, 0);

    const availableBalance = budget - totalYear;
    const budgetSpentPercentage = budget > 0 ? (totalYear / budget) * 100 : 0;

    // Projeção Inteligente
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dailyAverageMonth = totalMonth / dayOfMonth;
    const projectedMonthEnd = dailyAverageMonth * daysInMonth;

    const categoryBreakdown: Record<string, number> = {};
    CATEGORIES.forEach(cat => { categoryBreakdown[cat] = 0; });
    filteredExpenses.forEach(exp => {
      categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amount;
    });

    const cities = Array.from(new Set(expenses.map(e => e.city)));

    return {
      total,
      count,
      average,
      totalToday,
      totalMonth,
      totalYear,
      projectedMonthEnd,
      categoryBreakdown,
      availableBalance,
      budgetSpentPercentage,
      cities
    };
  }, [filteredExpenses, expenses, budget]);

  // --- INSIGHTS INTELIGENTES AUTOMÁTICOS ---
  const insights = useMemo(() => {
    const list: any[] = [];
    
    // Insight de Projeção
    if (metrics.projectedMonthEnd > budget && budget > 0) {
      list.push({
        type: 'danger',
        title: 'ALERTA DE PROJEÇÃO CRÍTICA',
        description: `No ritmo atual, você gastará R$ ${metrics.projectedMonthEnd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} até o fim do mês, superando seu orçamento de ${formatCurrency((budget * 100).toString())}.`,
        icon: TrendingUp
      });
    }

    if (metrics.budgetSpentPercentage > 95) {
      list.push({
        type: 'danger',
        title: 'LIMITE CRÍTICO ATINGIDO',
        description: `Você consumiu quase todo o seu orçamento de ${formatCurrency((budget * 100).toString())}. Saldo restante de apenas ${formatCurrency((metrics.availableBalance * 100).toString())}.`,
        icon: AlertTriangle
      });
    } else if (metrics.budgetSpentPercentage > 80) {
      list.push({
        type: 'danger',
        title: 'Atenção: Limite do Orçamento de Viagens',
        description: `Já atingimos ${metrics.budgetSpentPercentage.toFixed(1)}% do teto estipulado de ${formatCurrency((budget * 100).toString())}.`,
        icon: AlertTriangle
      });
    } else if (metrics.availableBalance > 0) {
      list.push({
        type: 'info',
        title: 'Orçamento com Saldo Positivo',
        description: `Você ainda possui ${formatCurrency((metrics.availableBalance * 100).toString())} disponíveis para novos gastos corporativos.`,
        icon: Lightbulb
      });
    }

    const expensiveMeals = filteredExpenses.filter(e => e.category === 'Alimentação' && e.amount > 300);
    if (expensiveMeals.length > 0) {
      list.push({
        type: 'warning',
        title: 'Alimentações com Valores Elevados',
        description: `Detectamos ${expensiveMeals.length} refeição(ões) individual(is) acima de R$ 300,00. Considere auditar.`,
        icon: DollarSign
      });
    }

    const kmTravels = filteredExpenses.filter(e => parseFloat(e.km) > 100);
    if (kmTravels.length > 0) {
      list.push({
        type: 'success',
        title: 'Otimização de Rota & KM Rodado',
        description: `Registros de alta quilometragem localizados. Deslocamentos geraram créditos tributários para a empresa.`,
        icon: Car
      });
    }

    const sortedCategories = (Object.entries(metrics.categoryBreakdown) as [string, number][])
      .sort((a, b) => b[1] - a[1]);
    if (sortedCategories.length > 0 && sortedCategories[0][1] > 0) {
      list.push({
        type: 'info',
        title: `Setor de Maior Custo: ${sortedCategories[0][0]}`,
        description: `Esta categoria representa R$ ${sortedCategories[0][1].toLocaleString('pt-BR', { minimumFractionDigits: 2 })} do montante exibido.`,
        icon: Layers
      });
    }

    return list;
  }, [metrics, filteredExpenses, budget]);

  // --- SUBMISSÃO DE COMPRAS ---
  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newExpense.productName || !newExpense.amount || !newExpense.city) {
      showToast('Por favor, preencha os campos obrigatórios!', 'error');
      return;
    }

    const created = {
      id: `EXP-${Math.floor(1000 + Math.random() * 9000)}`,
      productName: newExpense.productName,
      category: newExpense.category,
      amount: parseCurrencyToNumber(newExpense.amount),
      quantity: parseInt(newExpense.quantity || '1'),
      paymentMethod: newExpense.paymentMethod,
      vendor: newExpense.vendor || 'Não informado',
      city: newExpense.city,
      state: newExpense.state.toUpperCase() || 'UF',
      date: newExpense.date,
      time: newExpense.time || '12:00',
      notes: newExpense.notes,
      responsible: userData.fullName || 'Usuário do Sistema',
      responsibleRole: userData.jobTitle || 'Colaborador',
      responsibleId: userData.cpf || 'custom-usr',
      costCenter: newExpense.costCenter,
      travelNumber: newExpense.travelNumber || 'VJG-AVULSA',
      km: parseFloat(newExpense.km || '0'),
      expenseType: newExpense.expenseType,
      receipt: newExpense.receiptName || 'comprovante_anexado.png',
      status: 'Aprovado',
      approvedBy: 'Sistema Automático',
      createdAt: new Date().toISOString()
    };

    setExpenses([created, ...expenses]);
    showToast('Despesa registrada e aprovada com sucesso!', 'success');
    
    setNewExpense({
      productName: '',
      category: 'Alimentação',
      amount: '',
      quantity: '1',
      paymentMethod: 'Cartão Corporativo',
      vendor: '',
      city: '',
      state: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      notes: '',
      costCenter: 'Comercial - 102',
      travelNumber: '',
      km: '0',
      expenseType: 'Viagem Nacional',
      receiptName: '',
      status: 'Aprovado'
    });

    setActiveTab('despesas');
  };

  // --- SELEÇÃO DE ARQUIVO SIMULADA & SMART SCAN ---
  const handleSimulateFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewExpense(prev => ({ ...prev, receiptName: file.name }));
      
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        showToast(`Arquivo "${file.name}" anexado.`, 'success');
        return;
      }

      setIsScanning(true);
      showToast('Inteligência Artificial processando recibo...', 'info');

      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          
          try {
            const response = await fetch('/api/scan-receipt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64, mimeType: file.type })
            });

            if (!response.ok) throw new Error('Falha no processamento AI');
            
            const data = await response.json();
            
            setNewExpense(prev => ({
              ...prev,
              productName: data.productName || prev.productName,
              vendor: data.vendor || prev.vendor,
              amount: data.amount ? formatCurrency((data.amount * 100).toString()) : prev.amount,
              city: data.city || prev.city,
              state: data.state || prev.state,
              date: data.date || prev.date,
              category: data.category || prev.category
            }));

            showToast('Dados extraídos com sucesso via Smart Scan!', 'success');
          } catch (err) {
            console.error(err);
            showToast('Erro ao extrair dados. Preencha manualmente.', 'error');
          } finally {
            setIsScanning(false);
          }
        };
      } catch (err) {
        setIsScanning(false);
      }
    }
  };

  // --- AÇÕES DO GESTOR ---
  const handleApprove = (id: string, action: string) => {
    setExpenses(prev => prev.map(exp => {
      if (exp.id === id) {
        return {
          ...exp,
          status: action === 'approve' ? 'Aprovado' : 'Rejeitado',
          approvedBy: userData.fullName || 'Gestor Responsável'
        };
      }
      return exp;
    }));
    showToast(`Despesa ${id} foi ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso.`, 'success');
  };

  // --- EXPORTAÇÕES ---
  const exportToExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Header Metadata
    csvContent += "RELATORIO CORPORATIVO DE DESPESAS\r\n";
    csvContent += `COLABORADOR:;${userData.fullName}\r\n`;
    csvContent += `CPF:;${userData.cpf}\r\n`;
    csvContent += `CARGO:;${userData.jobTitle}\r\n`;
    csvContent += `PERIODO DO RELATORIO:;${new Date().toLocaleDateString('pt-BR')}\r\n`;
    csvContent += `SALDO TOTAL UTILIZADO:;R$ ${metrics.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\r\n`;
    csvContent += "\r\n";

    // Table Header
    csvContent += "ID;Produto/Servico;Categoria;Valor;Quantidade;Forma de Pagamento;Fornecedor;Cidade;UF;Data;Centro de Custo;Viagem;Status\r\n";
    
    filteredExpenses.forEach(exp => {
      const row = [
        exp.id,
        exp.productName,
        exp.category,
        exp.amount,
        exp.quantity,
        exp.paymentMethod,
        exp.vendor,
        exp.city,
        exp.state,
        exp.date,
        exp.costCenter,
        exp.travelNumber,
        exp.status
      ].map(v => typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v).join(";");
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Relatorio_Despesas_${userData.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Planilha profissional gerada com os seus dados!', 'success');
  };

  const exportToPDF = () => {
    window.print();
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* HEADER PROFISSIONAL PARA IMPRESSÃO (PDF) - Oculto na tela */}
      <div className="hidden print:block p-8 border-b-2 border-slate-900 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-900 text-white flex items-center justify-center rounded-2xl">
              <Briefcase className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-blue-900">Relatório de Despesas Corporativas</h1>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-3 mt-1">Travel Control - Financial Intelligence</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Documento Gerado em</p>
            <p className="text-sm font-black text-slate-900">{new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="space-y-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Colaborador Responsável</p>
              <p className="text-base font-black text-slate-900 leading-tight">{userData.fullName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">CPF</p>
                <p className="text-sm font-bold text-slate-700 leading-tight">{userData.cpf}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Cargo / Função</p>
                <p className="text-sm font-bold text-slate-700 leading-tight">{userData.jobTitle}</p>
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col justify-center border-l border-slate-200 pl-8">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Prestação de Contas</p>
            <p className="text-3xl font-black text-blue-900">R$ {metrics.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{filteredExpenses.length} Comprovantes Lançados</p>
          </div>
        </div>
      </div>

      {/* BOTÃO FLUTUANTE DE AJUDA / TUTORIAL */}
      <button 
        onClick={() => setShowTutorialModal(true)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-blue-900 hover:bg-blue-800 text-white shadow-2xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all group print:hidden"
        title="Passo a Passo de Uso"
      >
        <BookOpen className="w-5 h-5 animate-pulse" />
        <span className="text-xs font-bold max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out whitespace-nowrap">
          Passo a Passo
        </span>
      </button>

      {/* MODAL DO PASSO A PASSO / TUTORIAL */}
      <AnimatePresence>
        {showTutorialModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-2xl p-6 md:p-8 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg">Manual de Uso do Sistema</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Siga as instruções para extrair o máximo do app</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowTutorialModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-900 dark:text-blue-400 font-bold flex items-center justify-center shrink-0">1</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Defina Seu Nome</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-500">O sistema pergunta seu nome no primeiro acesso. Caso precise editar, clique no botão de perfil no canto superior direito.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-900 dark:text-blue-400 font-bold flex items-center justify-center shrink-0">2</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Registrar uma Nova Compra</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-500">Vá na aba "Registrar Compra", preencha os campos e anexe o comprovante (imagem ou PDF).</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-900 dark:text-blue-400 font-bold flex items-center justify-center shrink-0">3</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Monitorar Painel</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-500">Veja gráficos em tempo real e insights automáticos sobre os gastos de sua equipe.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setShowTutorialModal(false)}
                  className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-lg transition-colors"
                >
                  Entendi, Começar!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL INICIAL DE DADOS DO USUÁRIO */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-400 flex items-center justify-center mx-auto shadow-md">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">Configuração de Perfil Profissional</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Esses dados serão utilizados para gerar relatórios profissionais de despesas.
              </p>
            </div>
            <form onSubmit={handleSaveInitialName} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Nome Completo *</label>
                <input 
                  type="text"
                  required
                  placeholder="Nome do Colaborador"
                  value={editUserData.fullName}
                  onChange={(e) => setEditUserData({...editUserData, fullName: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm bg-transparent text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-900 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase px-1">CPF *</label>
                  <input 
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={editUserData.cpf}
                    onChange={(e) => setEditUserData({...editUserData, cpf: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm bg-transparent text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-900 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase px-1">RG</label>
                  <input 
                    type="text"
                    placeholder="00.000.000-0"
                    value={editUserData.rg}
                    onChange={(e) => setEditUserData({...editUserData, rg: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm bg-transparent text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-900 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Cargo / Função *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Gerente Comercial"
                  value={editUserData.jobTitle}
                  onChange={(e) => setEditUserData({...editUserData, jobTitle: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm bg-transparent text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-900 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Orçamento Inicial (R$) *</label>
                <input 
                  type="text"
                  required
                  placeholder="R$ 0,00"
                  value={editUserData.initialBudget}
                  onChange={(e) => setEditUserData({...editUserData, initialBudget: formatCurrency(e.target.value)})}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm bg-transparent text-emerald-600 font-bold border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-900 outline-none"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 mt-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm shadow-lg transition-all"
              >
                Salvar e Acessar
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL EDITAR PERFIL */}
      {isEditingName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base">Editar Perfil Profissional</h3>
              <button onClick={() => setIsEditingName(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateName} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Nome Completo</label>
                <input 
                  type="text"
                  required
                  value={editUserData.fullName}
                  onChange={(e) => setEditUserData({...editUserData, fullName: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm bg-transparent text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-900 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">CPF</label>
                  <input 
                    type="text"
                    required
                    value={editUserData.cpf}
                    onChange={(e) => setEditUserData({...editUserData, cpf: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm bg-transparent text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-900 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">RG</label>
                  <input 
                    type="text"
                    value={editUserData.rg}
                    onChange={(e) => setEditUserData({...editUserData, rg: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm bg-transparent text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-900 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Cargo / Função</label>
                <input 
                  type="text"
                  required
                  value={editUserData.jobTitle}
                  onChange={(e) => setEditUserData({...editUserData, jobTitle: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm bg-transparent text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-900 outline-none"
                />
              </div>
              <button type="submit" className="w-full py-2.5 mt-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all">
                Atualizar Perfil
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR ORÇAMENTO */}
      {isEditingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base">Definir Orçamento Disponível</h3>
              <button onClick={() => setIsEditingBudget(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateBudget} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Novo Valor de Orçamento (R$)</label>
                <input 
                  type="text"
                  required
                  placeholder="R$ 0,00"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(formatCurrency(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm bg-transparent text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-900 outline-none font-bold"
                />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all">
                Salvar Orçamento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border transition-all ${
              notification.type === 'success' 
                ? 'bg-emerald-500 border-emerald-600 text-white' 
                : 'bg-blue-900 border-blue-950 text-white'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span className="text-sm font-semibold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER PRINCIPAL */}
      <header className={`sticky top-0 z-40 border-b transition-colors duration-200 print:hidden ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-slate-200 backdrop-blur-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-white shadow-lg">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-blue-900 dark:text-blue-400">
                Travel <span className="text-blue-700">Control</span>
              </span>
            </div>

            <nav className="hidden md:flex items-center space-x-1">
              {['dashboard', 'despesas', 'cadastrar', 'insights', 'painel-gestor'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab 
                      ? 'bg-blue-900 text-white' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  } ${tab === 'painel-gestor' && activeTab !== tab ? 'border-l border-slate-200 dark:border-slate-800 ml-2 pl-4 text-blue-700' : ''}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl text-slate-500 hover:text-blue-900 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => { setEditUserData(userData); setIsEditingName(true); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold ${
                  isDarkMode ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-850' : 'bg-slate-100 border-slate-200 hover:bg-slate-200/60'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-[10px]">
                  {userData.fullName ? userData.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="font-bold text-[11px] leading-3">{userData.fullName ? userData.fullName.split(' ')[0] : 'Acessando...'}</p>
                </div>
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Menu Mobile */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-2 overflow-hidden"
            >
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'despesas', label: 'Minhas Despesas' },
                { id: 'cadastrar', label: 'Registrar Compra' },
                { id: 'insights', label: 'Insights' },
                { id: 'painel-gestor', label: 'Aprovações' },
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === item.id 
                      ? 'bg-blue-900 text-white' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-10">
            {/* NOVO HEADER DINÂMICO */}
            <div className="relative overflow-hidden p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-50"></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[10px] font-black uppercase tracking-widest text-blue-900 dark:text-blue-400 mb-4 border border-blue-100 dark:border-blue-900/50">
                    <Shield className="w-3 h-3" /> Monitoramento em Tempo Real
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-slate-900 dark:text-white leading-none">
                    Análise <span className="text-blue-900 dark:text-blue-400">Financeira</span>
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md font-medium">
                    Relatório dinâmico de despesas corporativas para <span className="text-slate-900 dark:text-white font-bold">{userData.fullName || 'Colaborador'}</span>.
                  </p>
                </div>

                <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 shadow-sm w-full md:w-auto justify-between">
                    <div className="flex items-center gap-2">
                      <select 
                        value={filterMonth} 
                        onChange={(e) => { setFilterMonth(parseInt(e.target.value)); setFilterPeriod('Mês Selecionado'); }}
                        className="bg-transparent text-[11px] font-black uppercase outline-none cursor-pointer text-slate-800 dark:text-slate-200"
                      >
                        {[
                          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                        ].map((m, i) => <option key={i} value={i} className="text-slate-900">{m}</option>)}
                      </select>
                      <div className="w-px h-3 bg-slate-300 dark:bg-slate-700"></div>
                      <select 
                        value={filterYear} 
                        onChange={(e) => { setFilterYear(parseInt(e.target.value)); setFilterPeriod('Mês Selecionado'); }}
                        className="bg-transparent text-[11px] font-black uppercase outline-none cursor-pointer text-slate-800 dark:text-slate-200"
                      >
                        {Array.from(new Set([2026, ...expenses.map(exp => new Date(exp.date + 'T00:00:00').getFullYear())])).sort((a, b) => b - a).map(y => (
                          <option key={y} value={y} className="text-slate-900">{y}</option>
                        ))}
                      </select>
                    </div>
                    <Calendar className="w-4 h-4 text-blue-900 dark:text-blue-400 ml-2" />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={exportToExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 transition-all shadow-sm">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Planilha
                    </button>
                    <button onClick={() => setActiveTab('cadastrar')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg bg-blue-900 text-white hover:bg-blue-800 transition-all">
                      <Plus className="w-3.5 h-3.5" /> Novo Registro
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* BENTO GRID DE MÉTRICAS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 print:hidden">
              {/* CARD PRINCIPAL (SALDO) */}
              <div className="md:col-span-12 lg:col-span-5 p-8 rounded-[2.5rem] bg-blue-900 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-800 rounded-full opacity-20 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
                <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200/60 mb-1">Status de Disponibilidade</p>
                      <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                        {metrics.availableBalance < 0 ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <Shield className="w-5 h-5 text-emerald-400" />}
                        Saldo Disponível
                      </h3>
                    </div>
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-white">
                      R$ {metrics.availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h4>
                    <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden backdrop-blur-md border border-white/10">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, 100 - metrics.budgetSpentPercentage))}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full ${metrics.availableBalance < 0 ? 'bg-red-400' : 'bg-emerald-400'}`}
                      />
                    </div>
                    <div className="flex justify-between mt-3">
                      <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">{metrics.budgetSpentPercentage.toFixed(1)}% Consumido</p>
                      <button 
                         onClick={() => { setBudgetInput(formatCurrency((budget * 100).toString())); setIsEditingBudget(true); }}
                         className="text-[10px] font-black bg-white text-blue-900 px-3 py-1 rounded-full uppercase hover:scale-105 transition-transform"
                      >
                        Ajustar Teto
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD SECUNDÁRIO (HOJE) */}
              <div className="md:col-span-6 lg:col-span-3 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-400 rounded-2xl group-hover:bg-blue-900 group-hover:text-white transition-colors">
                    <Clock className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-slate-300" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Fluxo Diário</p>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Gasto Hoje</h3>
                  <p className="text-3xl font-black text-blue-900 dark:text-blue-400 tracking-tighter">
                    R$ {metrics.totalToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* CARD TERCIÁRIO (MÊS) */}
              <div className="md:col-span-6 lg:col-span-4 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-400 rounded-2xl group-hover:bg-blue-900 group-hover:text-white transition-colors">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-blue-900 dark:text-blue-400 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-900/50">
                    ATIVO
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Mensal Consolidado</p>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Gasto Mês Atual</h3>
                  <p className="text-3xl font-black text-blue-900 dark:text-blue-400 tracking-tighter">
                    R$ {metrics.totalMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* CARD PROJEÇÃO (LONGO) - INTEGRADO */}
              <div className="md:col-span-12 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row items-center justify-between gap-8 group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/10 rounded-full blur-2xl opacity-50 -mt-10 -mr-10"></div>
                <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-inner border border-slate-200 dark:border-slate-700">
                    <TrendingUp className={`w-8 h-8 ${metrics.projectedMonthEnd > budget && budget > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 font-bold">Previsão Inteligente</p>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Projeção Final do Mês</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Baseado no ritmo atual de {metrics.count} lançamentos.</p>
                  </div>
                </div>

                <div className="w-full md:w-px h-px md:h-12 bg-slate-200 dark:bg-slate-800"></div>

                <div className="flex flex-col items-center md:items-end w-full md:w-auto relative z-10">
                  <p className="text-4xl font-black text-blue-900 dark:text-white tracking-tighter">
                    R$ {metrics.projectedMonthEnd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-2 inline-block ${metrics.projectedMonthEnd > budget && budget > 0 ? 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'}`}>
                    {metrics.projectedMonthEnd > budget && budget > 0 ? 'Risco de Estouro' : 'Dentro do Orçamento'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* CATEGORIAS - MAIS COMPACTO E ELEGANTE */}
              <div className={`p-8 rounded-[2.5rem] border lg:col-span-8 ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">Setores de Investimento</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Análise de custos por categoria de serviço</p>
                  </div>
                  <Layers className="w-5 h-5 text-slate-200" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {(Object.entries(metrics.categoryBreakdown) as [string, number][]).filter(([_, v]) => v > 0).map(([cat, val]) => (
                    <div key={cat} className="group">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <span className="text-[10px] font-black text-blue-900 dark:text-blue-400 uppercase tracking-widest block mb-0.5">{cat}</span>
                          <span className="text-lg font-black tracking-tighter">R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">
                          {((val / metrics.total) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(val / metrics.total) * 100}%` }}
                          className="h-full bg-blue-900 rounded-full group-hover:bg-blue-700 transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <div className="md:col-span-2 flex flex-col items-center py-12 text-slate-400">
                       <Layers className="w-10 h-10 mb-4 opacity-10" />
                       <p className="text-sm font-medium">Nenhuma movimentação para análise estrutural.</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* ORÇAMENTO - ESTILO WIDGET PREMIUM */}
              <div className={`p-8 rounded-[2.5rem] border lg:col-span-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Taxa de Consumo</h3>
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <Percent className="w-4 h-4 text-blue-900 dark:text-blue-400" />
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="88" cy="88" r="80" strokeWidth="12" fill="none" className="stroke-slate-50 dark:stroke-slate-800/50" />
                      <motion.circle 
                        cx="88" cy="88" r="80" 
                        strokeWidth="12" fill="none" 
                        strokeDasharray="502" 
                        initial={{ strokeDashoffset: 502 }}
                        animate={{ strokeDashoffset: 502 - (502 * Math.min(1.0, metrics.totalYear / budget)) }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className={metrics.totalYear > budget ? "stroke-red-500" : "stroke-blue-900"} 
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-4xl font-black tracking-tighter">{Math.round(metrics.budgetSpentPercentage)}%</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-3">Consumido</span>
                    </div>
                  </div>

                  <div className="mt-10 w-full space-y-4">
                    <div className="flex justify-between items-center p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                           <Target className="w-4 h-4 text-blue-900" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Orçamento Total</span>
                      </div>
                      <span className="text-sm font-black">R$ {budget.toLocaleString('pt-BR')}</span>
                    </div>

                    <div className={`flex justify-between items-center p-4 rounded-3xl border ${metrics.availableBalance < 0 ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30' : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                           {metrics.availableBalance < 0 ? <TrendingDown className="w-4 h-4 text-red-600" /> : <TrendingUp className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <span className={`text-[11px] font-bold uppercase ${metrics.availableBalance < 0 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                          {metrics.availableBalance < 0 ? 'Excesso em' : 'Restante'}
                        </span>
                      </div>
                      <span className={`text-sm font-black ${metrics.availableBalance < 0 ? 'text-red-800 dark:text-red-400' : 'text-emerald-800 dark:text-emerald-400'}`}>
                        R$ {Math.abs(metrics.availableBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* LISTA DE DESPESAS */}
        {activeTab === 'despesas' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
              <h1 className="text-2xl font-black">Minhas Despesas</h1>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filtrar por descrição, local ou categoria..." 
                  value={filterSearch}
                  onChange={e => setFilterSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 text-xs outline-none focus:ring-2 focus:ring-blue-900 shadow-sm"
                />
                {filterSearch && (
                  <button onClick={() => setFilterSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-black uppercase tracking-[0.1em] border-b border-slate-100 dark:border-slate-800">
                      <th className="p-5 font-black">ID</th>
                      <th className="p-5">Detalhamento</th>
                      <th className="p-5">Localidade</th>
                      <th className="p-5">C. Custo</th>
                      <th className="p-5 text-right">Montante</th>
                      <th className="p-5 text-center">Status</th>
                      <th className="p-5 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                        <td className="p-5 font-bold text-slate-400 dark:text-slate-500">#{exp.id.toString().padStart(4, '0')}</td>
                        <td className="p-5">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{exp.productName}</p>
                          <p className="text-[10px] text-blue-900 dark:text-blue-400 font-black uppercase tracking-widest mt-0.5">{exp.category}</p>
                        </td>
                        <td className="p-5">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">{exp.vendor}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" /> {exp.city}, {exp.state}
                          </p>
                        </td>
                        <td className="p-5">
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">{exp.costCenter}</span>
                        </td>
                        <td className="p-5 text-right font-black text-sm text-slate-900 dark:text-white">
                          R$ {exp.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            exp.status === 'Aprovado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${exp.status === 'Aprovado' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {exp.status}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <button 
                            onClick={() => setExpenses(expenses.filter(e => e.id !== exp.id))}
                            className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredExpenses.length === 0 && (
                      <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-bold">Nenhum registro encontrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* CADASTRAR */}
        {activeTab === 'cadastrar' && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-black">Registrar Nova Compra</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Insira os detalhes técnicos do gasto corporativo.</p>
            </div>
            <form onSubmit={handleSubmitExpense} className={`p-8 rounded-2xl border space-y-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Descrição do Item *</label>
                  <input required placeholder="Ex: Almoço Cliente, Hotel, Táxi..." value={newExpense.productName} onChange={e => setNewExpense({...newExpense, productName: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-900" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Valor Total (R$) *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="R$ 0,00"
                    value={newExpense.amount} 
                    onChange={e => {
                      const formatted = formatCurrency(e.target.value);
                      setNewExpense({...newExpense, amount: formatted});
                    }} 
                    className="w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-900 font-bold" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Quantidade *</label>
                  <input type="number" required value={newExpense.quantity} onChange={e => setNewExpense({...newExpense, quantity: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-900" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Categoria *</label>
                  <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-900">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Local / Fornecedor *</label>
                  <input required placeholder="Ex: Restaurante do Porto" value={newExpense.vendor} onChange={e => setNewExpense({...newExpense, vendor: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-900" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Cidade de Origem *</label>
                  <input required placeholder="Cidade" value={newExpense.city} onChange={e => setNewExpense({...newExpense, city: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-900" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">UF *</label>
                  <input required maxLength={2} placeholder="UF" value={newExpense.state} onChange={e => setNewExpense({...newExpense, state: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-900" />
                </div>
                <div className="md:col-span-2 space-y-1.5 relative">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Anexar Comprovante (Obrigatório)</label>
                  <label className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                    isScanning ? 'border-blue-500 bg-blue-50 animate-pulse' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}>
                    {isScanning ? (
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="text-xs font-black text-blue-900">IA LENDO RECIBO...</span>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{newExpense.receiptName || 'Clique para Smart Scan (IA) ou Arraste o PDF'}</span>
                      </>
                    )}
                    <input type="file" disabled={isScanning} onChange={handleSimulateFile} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="px-6 py-3 rounded-2xl text-sm font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Voltar ao Início
                </button>
                <button type="submit" className="px-8 py-3 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 transition-all transform active:scale-95">
                  REGISTRAR COMPRA AGORA
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* INSIGHTS */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black">Inteligência Financeira</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {insights.map((ins, i) => {
                const Icon = ins.icon;
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className={`p-6 rounded-2xl border flex items-start gap-4 ${
                      ins.type === 'danger' ? 'bg-blue-50 border-blue-100 text-blue-900' : 'bg-blue-50 border-blue-100 text-blue-900'
                    }`}
                  >
                    <div className="p-3 bg-white rounded-xl shadow-sm"><Icon className="w-6 h-6" /></div>
                    <div>
                      <h4 className="font-black text-sm">{ins.title}</h4>
                      <p className="text-xs mt-1 opacity-70">{ins.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* PAINEL GESTOR */}
        {activeTab === 'painel-gestor' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-900" />
              <h1 className="text-2xl font-black">Fluxo de Aprovação</h1>
            </div>
            <div className="p-10 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="font-black">Sem Pendências Cruciais</h3>
              <p className="text-sm text-slate-500 mt-2">Todas as despesas recentes foram processadas pelo motor de regras automático.</p>
            </div>
          </motion.div>
        )}

      </main>

      <footer className="mt-20 py-10 border-t border-slate-100 dark:border-slate-900 text-center print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-900 flex items-center justify-center text-white"><Briefcase className="w-3 h-3" /></div>
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">Travel <span className="text-blue-700">Control</span></span>
          </div>
          <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Desenvolvido por Benedito Junior</p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>

    </div>
  );
}
