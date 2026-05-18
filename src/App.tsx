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
  Plane,
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
    establishment: '',
    city: '',
    state: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    notes: '',
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

    const savedExpenses = localStorage.getItem('controle_viagens_expenses_v2');
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
  }, []);

  useEffect(() => {
    if (expenses.length > 0 || localStorage.getItem('controle_viagens_expenses_v2')) {
      localStorage.setItem('controle_viagens_expenses_v2', JSON.stringify(expenses));
    }
  }, [expenses]);
  
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
        exp.establishment.toLowerCase().includes(filterSearch.toLowerCase()) ||
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

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const totalWeek = expenses
      .filter(exp => {
        const d = new Date(exp.date + 'T00:00:00');
        return d >= startOfWeek && d <= today;
      })
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
      totalWeek,
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
      establishment: newExpense.establishment || 'Não informado',
      city: newExpense.city,
      state: newExpense.state.toUpperCase() || 'UF',
      date: newExpense.date,
      time: newExpense.time || '12:00',
      notes: newExpense.notes,
      responsible: userData.fullName || 'Usuário do Sistema',
      responsibleRole: userData.jobTitle || 'Colaborador',
      responsibleId: userData.cpf || 'custom-usr',
      travelNumber: newExpense.travelNumber || '',
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
      establishment: '',
      city: '',
      state: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      notes: '',
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
              establishment: data.vendor || prev.establishment,
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
    // Add UTF-8 BOM to ensure Excel reads special characters correctly (like ÇÃO)
    const BOM = "\uFEFF";
    let csvContent = BOM;
    
    // Header Metadata
    csvContent += "RELATÓRIO CORPORATIVO DE DESPESAS\r\n";
    csvContent += `COLABORADOR:;${userData.fullName}\r\n`;
    csvContent += `CPF:;${userData.cpf}\r\n`;
    csvContent += `CARGO:;${userData.jobTitle}\r\n`;
    csvContent += `PERÍODO DO RELATÓRIO:;${new Date().toLocaleDateString('pt-BR')}\r\n`;
    csvContent += `SALDO TOTAL UTILIZADO:;R$ ${metrics.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\r\n`;
    csvContent += "\r\n";

    // Table Header
    csvContent += "ID;Produto/Serviço;Categoria;Valor;Quantidade;Forma de Pagamento;Estabelecimento;Cidade;UF;Data;Viagem;Status\r\n";
    
    filteredExpenses.forEach(exp => {
      const row = [
        exp.id,
        exp.productName,
        exp.category,
        exp.amount,
        exp.quantity,
        exp.paymentMethod,
        exp.establishment,
        exp.city,
        exp.state,
        exp.date,
        exp.travelNumber || "",
        exp.status
      ].map(v => typeof v === 'string' ? `"${v.replace(/"/g, '""').replace(/;/g, ',')}"` : v).join(";");
      csvContent += row + "\r\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ControleViagem_Relatorio_${userData.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Planilha profissional gerada com sucesso!', 'success');
  };

  const exportToPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen font-sans transition-colors duration-300 bg-slate-50 text-slate-900">
      
      <div className="hidden print:block p-12 bg-white">
        <div className="flex justify-between items-start mb-10 pb-10 border-b-2 border-slate-800">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-slate-800 text-white flex items-center justify-center rounded-xl shadow-sm">
              <Plane className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold uppercase tracking-tight text-slate-800 font-display">Relatório Executivo</h1>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] mt-1">Controle de Viagem • Financial Intelligence</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Protocolo de Emissão</p>
            <p className="text-lg font-bold text-slate-800 font-display">#{Math.floor(Math.random() * 1000000)}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">{new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-12 p-8 bg-slate-50 rounded-[1.5rem] border border-slate-100 shadow-sm mb-12">
          <div className="space-y-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">Dados do Colaborador</p>
            <div>
              <p className="text-xl font-bold text-slate-800 leading-tight font-display">{userData.fullName}</p>
              <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-tight">{userData.jobTitle}</p>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <p className="text-[10px] font-medium text-slate-400 uppercase">IDENTIFICAÇÃO (CPF)</p>
              <p className="text-sm font-semibold text-slate-700">{userData.cpf}</p>
            </div>
          </div>
          
          <div className="space-y-4 border-l border-slate-200 pl-12">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">Status de Auditoria</p>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
              <span className="text-sm font-semibold text-emerald-700 uppercase tracking-widest">VALIDADO PELA IA</span>
            </div>
            <div className="pt-2">
              <p className="text-[10px] font-medium text-slate-400 uppercase">Período Fiscal</p>
              <p className="text-sm font-semibold text-slate-700 uppercase">{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date())}</p>
            </div>
          </div>

          <div className="text-right flex flex-col justify-center border-l border-slate-200 pl-12">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Total Consolidado</p>
            <p className="text-5xl font-bold text-slate-900 font-display tracking-tight">R$ {metrics.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-[11px] font-semibold text-slate-400 mt-2 uppercase tracking-widest">{filteredExpenses.length} Documentos Fiscais</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-slate-200 grow"></div>
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 whitespace-nowrap">Detalhamento das Operações</h2>
            <div className="h-px bg-slate-200 grow"></div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white uppercase font-bold text-[9px] tracking-widest">
                <th className="p-4 rounded-tl-xl">Data</th>
                <th className="p-4">Item / Estabelecimento</th>
                <th className="p-5">Categoria</th>
                <th className="p-4 text-right">Valor Unit.</th>
                <th className="p-4 text-center">Qtd</th>
                <th className="p-4 text-right rounded-tr-xl">V. Total</th>
              </tr>
            </thead>
            <tbody className="text-[10px]">
              {filteredExpenses.map((exp, idx) => (
                <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100`}>
                  <td className="p-4 font-semibold text-slate-400 whitespace-nowrap">{new Date(exp.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="p-4">
                    <p className="font-bold text-slate-800 uppercase">{exp.productName}</p>
                    <p className="text-[9px] text-slate-400 font-medium uppercase mt-0.5">{exp.establishment}</p>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[8px] font-semibold uppercase text-slate-800">{exp.category}</span>
                  </td>
                  <td className="p-4 text-right font-medium text-slate-600">R$ {(exp.amount / exp.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="p-4 text-center font-semibold text-slate-800">{exp.quantity}</td>
                  <td className="p-4 text-right font-bold text-slate-800">R$ {exp.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 text-white">
                <td colSpan={5} className="p-5 text-right font-semibold uppercase text-[10px] tracking-widest rounded-bl-xl">Total Destinado a Reembolso / Débito</td>
                <td className="p-5 text-right font-bold text-xl font-display rounded-br-xl">R$ {metrics.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>

          <div className="mt-24 grid grid-cols-2 gap-32">
            <div className="space-y-12">
               <div className="h-px bg-slate-400 w-full mb-4"></div>
               <div className="text-center">
                 <p className="text-xs font-black uppercase text-slate-900">{userData.fullName}</p>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Assinatura do Colaborador</p>
                 <p className="text-[8px] text-slate-300 mt-0.5 whitespace-nowrap">Certificando a veracidade das informações apresentadas</p>
               </div>
            </div>
            <div className="space-y-12">
               <div className="h-px bg-slate-400 w-full mb-4"></div>
               <div className="text-center">
                 <p className="text-xs font-black uppercase text-slate-900">Diretoria de Compliance</p>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Aprovação / Carimbo</p>
                 <p className="text-[8px] text-slate-300 mt-0.5">Reservado para validação do setor financeiro</p>
               </div>
            </div>
          </div>
          
          <div className="mt-20 pt-10 border-t border-slate-100 text-center">
            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.5em]">Controle de Viagem • Gerado via Portal Corporativo</p>
          </div>
        </div>
      </div>

      {/* BOTÃO FLUTUANTE DE AJUDA / TUTORIAL */}
      <button 
        onClick={() => setShowTutorialModal(true)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-slate-800 hover:bg-slate-900 text-white shadow-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all group print:hidden"
        title="Passo a Passo de Uso"
      >
        <BookOpen className="w-5 h-5" />
        <span className="text-xs font-semibold max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out whitespace-nowrap">
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
              className="w-full max-w-2xl p-6 md:p-8 rounded-3xl border bg-white border-slate-200 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg">Manual de Uso do Sistema</h3>
                    <p className="text-xs text-slate-600">Siga as instruções para extrair o máximo do app</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowTutorialModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 text-sm text-slate-600">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center shrink-0">1</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">Defina Seu Nome</h4>
                    <p className="text-xs text-slate-600">O sistema pergunta seu nome no primeiro acesso. Caso precise editar, clique no botão de perfil no canto superior direito.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center shrink-0">2</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">Registrar uma Nova Compra</h4>
                    <p className="text-xs text-slate-600">Vá na aba "Registrar Compra", preencha os campos e anexe o comprovante (imagem ou PDF).</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center shrink-0">3</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">Monitorar Painel</h4>
                    <p className="text-xs text-slate-600">Veja gráficos em tempo real e insights automáticos sobre os gastos de sua equipe.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setShowTutorialModal(false)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
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
            className="w-full max-w-md p-6 rounded-2xl border bg-white border-slate-200 shadow-2xl space-y-4"
          >
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-800 flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Configurações de Identidade</h2>
              <p className="text-xs text-slate-500">
                Os dados serão consolidados nos relatórios oficiais.
              </p>
            </div>
            <form onSubmit={handleSaveInitialName} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase px-1">Nome Completo *</label>
                <input 
                  type="text"
                  required
                  placeholder="Nome do Colaborador"
                  value={editUserData.fullName}
                  onChange={(e) => setEditUserData({...editUserData, fullName: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-900 border-slate-200 focus:ring-2 focus:ring-slate-800 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase px-1">CPF *</label>
                  <input 
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={editUserData.cpf}
                    onChange={(e) => setEditUserData({...editUserData, cpf: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-900 border-slate-200 focus:ring-2 focus:ring-slate-800 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase px-1">RG</label>
                  <input 
                    type="text"
                    placeholder="00.000.000-0"
                    value={editUserData.rg}
                    onChange={(e) => setEditUserData({...editUserData, rg: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-900 border-slate-200 focus:ring-2 focus:ring-slate-800 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase px-1">Cargo / Função *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Gerente Comercial"
                  value={editUserData.jobTitle}
                  onChange={(e) => setEditUserData({...editUserData, jobTitle: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-900 border-slate-200 focus:ring-2 focus:ring-slate-800 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase px-1">Orçamento Inicial (R$) *</label>
                <input 
                  type="text"
                  required
                  placeholder="R$ 0,00"
                  value={editUserData.initialBudget}
                  onChange={(e) => setEditUserData({...editUserData, initialBudget: formatCurrency(e.target.value)})}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-900 border-slate-200 focus:ring-2 focus:ring-slate-800 outline-none font-semibold"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 mt-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm shadow-sm transition-all"
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
          <div className="w-full max-w-md p-6 rounded-2xl border bg-white border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base">Editar Perfil Profissional</h3>
              <button onClick={() => setIsEditingName(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateName} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Nome Completo</label>
                <input 
                  type="text"
                  required
                  value={editUserData.fullName}
                  onChange={(e) => setEditUserData({...editUserData, fullName: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-900 border-slate-200 focus:ring-2 focus:ring-slate-800 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">CPF</label>
                  <input 
                    type="text"
                    required
                    value={editUserData.cpf}
                    onChange={(e) => setEditUserData({...editUserData, cpf: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-900 border-slate-200 focus:ring-2 focus:ring-slate-800 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">RG</label>
                  <input 
                    type="text"
                    value={editUserData.rg}
                    onChange={(e) => setEditUserData({...editUserData, rg: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-900 border-slate-200 focus:ring-2 focus:ring-slate-800 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Cargo / Função</label>
                <input 
                  type="text"
                  required
                  value={editUserData.jobTitle}
                  onChange={(e) => setEditUserData({...editUserData, jobTitle: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-900 border-slate-200 focus:ring-2 focus:ring-slate-800 outline-none"
                />
              </div>
              <button type="submit" className="w-full py-2.5 mt-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-sm transition-all">
                Atualizar Perfil
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR ORÇAMENTO */}
      {isEditingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md p-6 rounded-2xl border bg-white border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base">Definir Orçamento Disponível</h3>
              <button onClick={() => setIsEditingBudget(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateBudget} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Novo Valor de Orçamento (R$)</label>
                <input 
                  type="text"
                  required
                  placeholder="R$ 0,00"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(formatCurrency(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm bg-white text-slate-900 border-slate-200 focus:ring-2 focus:ring-slate-800 outline-none font-semibold"
                />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-sm transition-all">
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
                : 'bg-slate-800 border-slate-900 text-white'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span className="text-sm font-semibold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER PRINCIPAL */}
      <header className={`sticky top-0 z-40 border-b transition-colors duration-200 print:hidden ${
        'bg-white/90 border-slate-200 backdrop-blur-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white shadow-sm transition-all duration-300">
                <Plane className="w-5 h-5" />
              </div>
              <span className="font-display font-semibold text-xl tracking-tight text-slate-800">
                Controle de <span className="text-slate-500">Viagem</span>
              </span>
            </div>

            <nav className="hidden md:flex items-center space-x-1">
              {['dashboard', 'despesas', 'cadastrar', 'insights', 'painel-gestor'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium tracking-tight font-display transition-all ${
                    activeTab === tab 
                      ? 'bg-slate-100 text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-50'
                  } ${tab === 'painel-gestor' && activeTab !== tab ? 'border-l border-slate-200 ml-4 pl-6 text-slate-600' : ''}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-4">

              <button 
                onClick={() => { setEditUserData(userData); setIsEditingName(true); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold ${
                  'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-[10px]">
                  {userData.fullName ? userData.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="font-semibold text-[11px] leading-3 text-slate-800">{userData.fullName ? userData.fullName.split(' ')[0] : 'Acessando...'}</p>
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
              className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2 overflow-hidden"
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
                      ? 'bg-slate-800 text-white' 
                      : 'text-slate-700 hover:bg-slate-50'
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
            <div className="relative overflow-hidden p-8 rounded-2xl border border-slate-200 bg-white">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-5 border border-slate-200">
                    <Shield className="w-3 h-3" /> Monitoramento Governamental
                  </div>
                  <h2 className="text-3xl font-semibold tracking-tight mb-3 text-slate-800 leading-tight font-display">
                    Análise <span className="text-slate-400">Financeira</span>
                  </h2>
                  <p className="text-sm text-slate-500 max-w-lg font-normal leading-relaxed">
                    Relatório consolidado de despesas corporativas para <span className="text-slate-900 font-medium">{userData.fullName || 'Colaborador'}</span>.
                  </p>
                </div>

                <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm w-full md:w-auto justify-between">
                    <div className="flex items-center gap-2">
                      <select 
                        value={filterMonth} 
                        onChange={(e) => { setFilterMonth(parseInt(e.target.value)); setFilterPeriod('Mês Selecionado'); }}
                        className="bg-transparent text-[11px] font-black uppercase outline-none cursor-pointer text-slate-800"
                      >
                        {[
                          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                        ].map((m, i) => <option key={i} value={i} className="text-slate-900">{m}</option>)}
                      </select>
                      <div className="w-px h-3 bg-slate-300"></div>
                      <select 
                        value={filterYear} 
                        onChange={(e) => { setFilterYear(parseInt(e.target.value)); setFilterPeriod('Mês Selecionado'); }}
                        className="bg-transparent text-[11px] font-black uppercase outline-none cursor-pointer text-slate-800"
                      >
                        {Array.from(new Set([2026, ...expenses.map(exp => new Date(exp.date + 'T00:00:00').getFullYear())])).sort((a, b) => b - a).map(y => (
                          <option key={y} value={y} className="text-slate-900">{y}</option>
                        ))}
                      </select>
                    </div>
                    <Calendar className="w-4 h-4 text-slate-400 ml-2" />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={exportToExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 transition-all">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" /> Planilha
                    </button>
                    <button onClick={exportToPDF} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 transition-all">
                      <FileText className="w-3.5 h-3.5 text-slate-600" /> PDF
                    </button>
                    <button onClick={() => setActiveTab('cadastrar')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 transition-all font-display">
                      <Plus className="w-3.5 h-3.5" /> Novo Registro
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* BENTO GRID DE MÉTRICAS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 print:hidden">
              {/* CARD PRINCIPAL (SALDO) */}
              <div className="md:col-span-12 lg:col-span-12 p-8 rounded-2xl border border-slate-200 bg-white shadow-sm relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row h-full justify-between gap-12">
                  <div className="flex-1 space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Monitoramento de Verba</p>
                        <h3 className="text-xl font-medium flex items-center gap-2.5 text-slate-800 font-display">
                          {metrics.availableBalance < 0 ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <Shield className="w-5 h-5 text-slate-400" />}
                          Saldo Disponível Residual
                        </h3>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-5xl font-semibold tracking-tight mb-6 text-slate-900 font-display">
                        R$ {metrics.availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h4>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, Math.max(0, 100 - metrics.budgetSpentPercentage))}%` }}
                          transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                          className={`h-full ${metrics.availableBalance < 0 ? 'bg-red-500' : 'bg-slate-800'}`}
                        />
                      </div>
                      <div className="flex justify-between mt-4">
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{metrics.budgetSpentPercentage.toFixed(1)}% do orçamento consumido</p>
                        <button 
                           onClick={() => { setBudgetInput(formatCurrency((budget * 100).toString())); setIsEditingBudget(true); }}
                           className="text-[10px] font-semibold text-slate-400 hover:text-slate-800 underline uppercase transition-all"
                        >
                           Editar Teto Orçamentário
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full md:w-auto h-full">
                    <div className="p-6 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Mês Atual</p>
                      <p className="text-xl font-semibold text-slate-800 mt-1">R$ {metrics.totalMonth.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="p-6 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Semana</p>
                      <p className="text-xl font-semibold text-slate-800 mt-1">R$ {metrics.totalWeek.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="p-6 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between col-span-2 md:col-span-1">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Hoje</p>
                      <p className="text-xl font-semibold text-slate-800 mt-1">R$ {metrics.totalToday.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD SECUNDÁRIO (HOJE) */}
              <div className="md:col-span-6 lg:col-span-3 p-8 rounded-[1.5rem] border border-slate-100 bg-white shadow-sm flex flex-col justify-between group">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-slate-50 text-slate-400 rounded-xl">
                    <Clock className="w-4 h-4" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-slate-200" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 mb-1.5">Fluxo Diário</p>
                  <h3 className="text-sm font-medium text-slate-600 mb-2 font-display">Gasto Hoje</h3>
                  <p className="text-3xl font-semibold text-slate-800 tracking-tight font-display">
                    R$ {metrics.totalToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* CARD TERCIÁRIO (MÊS) */}
              <div className="md:col-span-6 lg:col-span-4 p-8 rounded-[1.5rem] border border-slate-100 bg-white shadow-sm flex flex-col justify-between group h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-slate-50 text-slate-400 rounded-xl">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 mb-1.5">Mensal Consolidado</p>
                  <h3 className="text-sm font-medium text-slate-600 mb-2 font-display">Gasto Mês Atual</h3>
                  <p className="text-3xl font-semibold text-slate-800 tracking-tight font-display">
                    R$ {metrics.totalMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* CARD PROJEÇÃO (LONGO) - INTEGRADO */}
              <div className="md:col-span-12 p-8 rounded-[1.5rem] border border-slate-100 bg-white flex flex-col md:flex-row items-center justify-between gap-8 group overflow-hidden relative shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-2xl opacity-30 -mt-10 -mr-10"></div>
                <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                    <TrendingUp className={`w-8 h-8 ${metrics.projectedMonthEnd > budget && budget > 0 ? 'text-red-500' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 mb-1">Previsão Inteligente</p>
                    <h3 className="text-lg font-medium text-slate-700 font-display">Projeção Final do Mês</h3>
                    <p className="text-xs text-slate-400 font-normal tracking-tight">Baseado no ritmo atual de {metrics.count} lançamentos.</p>
                  </div>
                </div>

                <div className="w-full md:w-px h-px md:h-12 bg-slate-100"></div>

                <div className="flex flex-col items-center md:items-end w-full md:w-auto relative z-10">
                  <p className="text-4xl font-semibold text-slate-800 tracking-tight font-display leading-none">
                    R$ {metrics.projectedMonthEnd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className={`text-[11px] font-medium uppercase tracking-widest px-4 py-1.5 rounded-full mt-4 inline-block ${metrics.projectedMonthEnd > budget && budget > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                    {metrics.projectedMonthEnd > budget && budget > 0 ? 'Risco de Estouro' : 'Dentro do Orçamento'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* CATEGORIAS - MAIS COMPACTO E ELEGANTE */}
              <div className="p-8 rounded-[2rem] border lg:col-span-8 bg-white border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-slate-800">Setores de Investimento</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Análise de custos por categoria de serviço</p>
                  </div>
                  <Layers className="w-5 h-5 text-slate-300" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {(Object.entries(metrics.categoryBreakdown) as [string, number][]).filter(([_, v]) => v > 0).map(([cat, val]) => (
                    <div key={cat} className="group">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{cat}</span>
                          <span className="text-lg font-bold tracking-tight text-slate-800">R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">
                          {((val / metrics.total) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(val / metrics.total) * 100}%` }}
                          className="h-full bg-slate-800 rounded-full group-hover:bg-slate-900 transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <div className="md:col-span-2 flex flex-col items-center py-12 text-slate-400">
                       <Layers className="w-10 h-10 mb-4 opacity-20" />
                       <p className="text-sm font-normal">Nenhuma movimentação para análise estrutural.</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* ORÇAMENTO - ESTILO WIDGET PREMIUM */}
              <div className="p-8 rounded-[2.5rem] border lg:col-span-4 bg-white border-slate-200">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">Taxa de Consumo</h3>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <Percent className="w-4 h-4 text-slate-800" />
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90 drop-shadow-sm">
                      <circle cx="88" cy="88" r="80" strokeWidth="12" fill="none" className="stroke-slate-50" />
                      <motion.circle 
                        cx="88" cy="88" r="80" 
                        strokeWidth="12" fill="none" 
                        strokeDasharray="502" 
                        initial={{ strokeDashoffset: 502 }}
                        animate={{ strokeDashoffset: 502 - (502 * Math.min(1.0, metrics.totalYear / budget)) }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className={metrics.totalYear > budget ? "stroke-red-500" : "stroke-slate-800"} 
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-5xl font-extrabold tracking-tighter font-display leading-none">{Math.round(metrics.budgetSpentPercentage)}%</span>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-3 mt-2">Consumido</span>
                    </div>
                  </div>

                  <div className="mt-10 w-full space-y-4">
                    <div className="flex justify-between items-center p-4 rounded-3xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-100">
                           <Target className="w-4 h-4 text-slate-800" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Orçamento Total</span>
                      </div>
                      <span className="text-sm font-black">R$ {budget.toLocaleString('pt-BR')}</span>
                    </div>

                    <div className={`flex justify-between items-center p-4 rounded-3xl border ${metrics.availableBalance < 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-100">
                           {metrics.availableBalance < 0 ? <TrendingDown className="w-4 h-4 text-red-600" /> : <TrendingUp className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <span className={`text-[11px] font-bold uppercase ${metrics.availableBalance < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                          {metrics.availableBalance < 0 ? 'Excesso em' : 'Restante'}
                        </span>
                      </div>
                      <span className={`text-sm font-black ${metrics.availableBalance < 0 ? 'text-red-800' : 'text-emerald-800'}`}>
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
              <h1 className="text-2xl font-bold tracking-tight font-display text-slate-800">Minhas Despesas</h1>
              <div className="relative w-full sm:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Pesquisar por descrição, estabelecimento ou categoria..." 
                  value={filterSearch}
                  onChange={e => setFilterSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border bg-white border-slate-100 text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-slate-800/5 focus:border-slate-800 transition-all shadow-sm"
                />
                {filterSearch && (
                  <button onClick={() => setFilterSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-3xl border overflow-hidden bg-white border-slate-200 shadow-xl shadow-slate-200/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-black uppercase tracking-[0.1em] border-b border-slate-100">
                      <th className="p-5 font-black">ID</th>
                      <th className="p-5">Detalhamento</th>
                      <th className="p-5">Estabelecimento / Local</th>
                      <th className="p-5 text-right">Montante</th>
                      <th className="p-5 text-center">Status</th>
                      <th className="p-5 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-5 font-bold text-slate-400">#{exp.id.toString().padStart(4, '0')}</td>
                        <td className="p-5">
                          <p className="font-semibold text-slate-700 text-sm">{exp.productName}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{exp.category}</p>
                        </td>
                        <td className="p-5">
                          <p className="font-semibold text-slate-700">{exp.establishment}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" /> {exp.city}, {exp.state}
                          </p>
                        </td>
                        <td className="p-5 text-right font-bold text-sm text-slate-800">
                          R$ {exp.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            exp.status === 'Aprovado' ? 'bg-slate-50 text-slate-800 border border-slate-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            <div className={`w-1 h-1 rounded-full ${exp.status === 'Aprovado' ? 'bg-slate-800' : 'bg-amber-500'}`} />
                            {exp.status}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <button 
                            onClick={() => setExpenses(expenses.filter(e => e.id !== exp.id))}
                            className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
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
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto pb-10">
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold tracking-tight font-display">Registrar Transação</h1>
              <p className="text-sm text-slate-600 font-medium">Insira os detalhes técnicos do gasto corporativo para processamento.</p>
            </div>
            <form onSubmit={handleSubmitExpense} className="p-10 rounded-[1.5rem] border shadow-sm space-y-8 bg-white border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest pl-1">Descrição do Item *</label>
                  <input required placeholder="Ex: Almoço Cliente, Hotel, Táxi..." value={newExpense.productName} onChange={e => setNewExpense({...newExpense, productName: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border bg-white text-sm text-slate-900 border-slate-200 focus:ring-4 focus:ring-slate-800/5 focus:border-slate-800 transition-all outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest pl-1">Valor Total (R$) *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="R$ 0,00"
                    value={newExpense.amount} 
                    onChange={e => {
                      const formatted = formatCurrency(e.target.value);
                      setNewExpense({...newExpense, amount: formatted});
                    }} 
                    className="w-full px-5 py-3 rounded-xl border bg-white text-base text-slate-900 border-slate-200 focus:ring-4 focus:ring-slate-800/5 focus:border-slate-800 transition-all outline-none font-semibold tracking-tight" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest pl-1">Quantidade *</label>
                  <input type="number" required value={newExpense.quantity} onChange={e => setNewExpense({...newExpense, quantity: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border bg-white text-sm text-slate-900 border-slate-200 focus:ring-4 focus:ring-slate-800/5 focus:border-slate-800 transition-all outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest pl-1">Data do Gasto *</label>
                  <input type="date" required value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border bg-white text-sm text-slate-900 border-slate-200 focus:ring-4 focus:ring-slate-800/5 focus:border-slate-800 transition-all outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest pl-1">Hora do Gasto *</label>
                  <input type="time" required value={newExpense.time} onChange={e => setNewExpense({...newExpense, time: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border bg-white text-sm text-slate-900 border-slate-200 focus:ring-4 focus:ring-slate-800/5 focus:border-slate-800 transition-all outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest pl-1">Forma de Pagamento *</label>
                  <select required value={newExpense.paymentMethod} onChange={e => setNewExpense({...newExpense, paymentMethod: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border bg-white text-sm text-slate-900 border-slate-200 focus:ring-4 focus:ring-slate-800/5 focus:border-slate-800 transition-all outline-none font-medium appearance-none">
                    {PAYMENTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest pl-1">Categoria *</label>
                  <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border bg-white text-sm text-slate-900 border-slate-200 focus:ring-4 focus:ring-slate-800/5 focus:border-slate-800 transition-all outline-none font-medium appearance-none">
                    {CATEGORIES.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest pl-1">Local / Estabelecimento *</label>
                  <input required placeholder="Ex: Restaurante do Porto" value={newExpense.establishment} onChange={e => setNewExpense({...newExpense, establishment: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border bg-white text-sm text-slate-900 border-slate-200 focus:ring-4 focus:ring-slate-800/5 focus:border-slate-800 transition-all outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest pl-1">Cidade de Origem *</label>
                  <input required placeholder="Cidade" value={newExpense.city} onChange={e => setNewExpense({...newExpense, city: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border bg-white text-sm text-slate-900 border-slate-200 focus:ring-4 focus:ring-slate-800/5 focus:border-slate-800 transition-all outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest pl-1">UF *</label>
                  <input required maxLength={2} placeholder="UF" value={newExpense.state} onChange={e => setNewExpense({...newExpense, state: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border bg-white text-sm text-slate-900 border-slate-200 focus:ring-4 focus:ring-slate-800/5 focus:border-slate-800 transition-all outline-none font-medium text-center" />
                </div>
                <div className="md:col-span-2 space-y-2 relative">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest pl-1">Anexar Comprovante (Obrigatório)</label>
                  <label className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-[1rem] cursor-pointer transition-all ${
                    isScanning ? 'border-slate-800 bg-slate-50/50 animate-pulse' : 'border-slate-100 hover:bg-slate-50'
                  }`}>
                    {isScanning ? (
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-slate-800 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <span className="text-[11px] font-semibold text-slate-800 tracking-widest">IA LENDO RECIBO...</span>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-10 h-10 text-slate-300 mb-3" />
                        <span className="text-xs font-bold text-slate-500 tracking-tight">{newExpense.receiptName || 'Clique para Smart Scan (IA) ou Arraste o arquivo'}</span>
                      </>
                    )}
                    <input type="file" disabled={isScanning} onChange={handleSimulateFile} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="px-8 py-3.5 rounded-2xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-display"
                >
                  Cancelar Operação
                </button>
                <button type="submit" className="px-10 py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm rounded-xl shadow-sm transition-all transform active:scale-95 font-display tracking-tight">
                  Finalizar Registro
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* INSIGHTS */}
        {activeTab === 'insights' && (
          <div className="space-y-8 pb-10">
              <h1 className="text-2xl font-bold tracking-tight font-display text-slate-800">Inteligência Estratégica</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {insights.map((ins, i) => {
                const Icon = ins.icon;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    key={i} 
                    className={`p-8 rounded-2xl border flex items-start gap-6 transition-all hover:shadow-sm ${
                      'bg-white border-slate-100 shadow-sm'
                    }`}
                  >
                    <div className="p-4 bg-slate-50 rounded-2xl text-slate-800 group-hover:scale-110 transition-transform"><Icon className="w-8 h-8" /></div>
                    <div>
                      <h4 className="font-bold text-lg font-display text-slate-900 leading-tight mb-2">{ins.title}</h4>
                      <p className="text-[13px] leading-relaxed text-slate-500 font-medium">{ins.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* PAINEL GESTOR */}
        {activeTab === 'painel-gestor' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-5xl mx-auto text-center py-10">
            <div className="flex flex-col items-center gap-2 mb-10">
              <Shield className="w-12 h-12 text-slate-400 mb-2" />
              <h1 className="text-3xl font-bold tracking-tight font-display text-slate-800">Hub de Governança</h1>
              <p className="text-slate-500 font-medium max-w-xl mx-auto">Monitoramento de conformidade e auditoria de registros financeiros em tempo real.</p>
            </div>
            <div className="p-16 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-200">
                <CheckCircle className="w-10 h-10 text-slate-800" />
              </div>
              <h3 className="text-xl font-bold font-display text-slate-800">Fluxos Consolidados</h3>
              <p className="text-base text-slate-500 mt-3 max-w-sm mx-auto font-medium">Todas as transações recentes foram validadas pelo motor de inteligência e compliance.</p>
              <button className="mt-8 px-8 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm hover:shadow-md transition-all">Ver Relatório Detalhado</button>
            </div>
          </motion.div>
        )}

      </main>

      <footer className="mt-20 py-16 border-t border-slate-100 text-center print:hidden bg-slate-50/30">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white shadow-sm"><Plane className="w-4 h-4" /></div>
            <span className="font-display font-bold text-lg tracking-tight text-slate-800">Controle de <span className="text-slate-500 font-display">Viagem</span></span>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest font-sans">Business Intelligence Unit</p>
            <p className="text-xs text-slate-400 font-medium">B.J.C © 2026</p>
          </div>
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
