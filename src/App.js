import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, setDoc, query, where } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShieldCheck, Bot, CalendarDays, Users, Plus, X, Copy, Trash2, Edit } from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE ---
// As variáveis __firebase_config e __initial_auth_token são injetadas pelo ambiente.
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDKABhLHf9kU6QxCtMqIhsaH_BCwE6Geko",
  authDomain: "meu-gestao-pro-online.firebaseapp.com",
  projectId: "meu-gestao-pro-online",
  storageBucket: "meu-gestao-pro-online.firebasestorage.app",
  messagingSenderId: "325531839534",
  appId: "1:325531839534:web:7cced8d4cd54c8502683bf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// --- ÍCONES E COMPONENTES DE UI ---

const ICONS = {
    dashboard: <DollarSign className="h-5 w-5" />,
    pricing: <ShieldCheck className="h-5 w-5" />,
    marketing: <Bot className="h-5 w-5" />,
    scheduling: <CalendarDays className="h-5 w-5" />,
    clients: <Users className="h-5 w-5" />,
};

const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 transition-all duration-300 ${className}`}>
        {children}
    </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md m-4 transform transition-all duration-300 scale-95 hover:scale-100">
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

const Input = (props) => (
    <input {...props} className={`w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-gray-200 transition-shadow ${props.className}`} />
);

const Button = ({ children, onClick, className = '', variant = 'primary' }) => {
    const baseClasses = "px-6 py-3 font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 transition-all duration-300 flex items-center justify-center gap-2";
    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
        secondary: "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-400",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    };
    return <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</button>;
};

// --- MÓDULOS DO APLICATIVO ---

const FinancialDashboard = ({ userId }) => {
    const [finances, setFinances] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ type: 'revenue', description: '', amount: '', service: '' });

    useEffect(() => {
        if (!userId) return;
        const q = query(collection(db, `/artifacts/${appId}/users/${userId}/finances`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFinances(data);
        });
        return () => unsubscribe();
    }, [userId]);

    const handleAddFinance = async (e) => {
        e.preventDefault();
        if (!form.description || !form.amount) return;
        await addDoc(collection(db, `/artifacts/${appId}/users/${userId}/finances`), {
            ...form,
            amount: parseFloat(form.amount),
            date: new Date().toISOString()
        });
        setForm({ type: 'revenue', description: '', amount: '', service: '' });
        setIsModalOpen(false);
    };
    
    const handleDelete = async (id) => {
        await deleteDoc(doc(db, `/artifacts/${appId}/users/${userId}/finances`, id));
    };

    const data = useMemo(() => {
        const revenue = finances.filter(f => f.type === 'revenue').reduce((acc, f) => acc + f.amount, 0);
        const expenses = finances.filter(f => f.type === 'expense').reduce((acc, f) => acc + f.amount, 0);
        const profit = revenue - expenses;
        return { revenue, expenses, profit };
    }, [finances]);
    
    const serviceProfitability = useMemo(() => {
        const services = {};
        finances.forEach(f => {
            if (f.service) {
                if (!services[f.service]) services[f.service] = { revenue: 0, expenses: 0 };
                if (f.type === 'revenue') services[f.service].revenue += f.amount;
                if (f.type === 'expense') services[f.service].expenses += f.amount;
            }
        });
        return Object.entries(services).map(([name, { revenue, expenses }]) => ({
            name,
            Lucro: revenue - expenses,
        })).sort((a, b) => b.Lucro - a.Lucro);
    }, [finances]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard Financeiro</h2>
                <Button onClick={() => setIsModalOpen(true)}><Plus className="h-5 w-5" /> Novo Lançamento</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-green-400 to-green-600 text-white">
                    <h3 className="text-lg font-semibold">Receita Total</h3>
                    <p className="text-4xl font-bold">R$ {data.revenue.toFixed(2)}</p>
                </Card>
                <Card className="bg-gradient-to-br from-red-400 to-red-600 text-white">
                    <h3 className="text-lg font-semibold">Despesa Total</h3>
                    <p className="text-4xl font-bold">R$ {data.expenses.toFixed(2)}</p>
                </Card>
                <Card className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
                    <h3 className="text-lg font-semibold">Lucro Líquido</h3>
                    <p className="text-4xl font-bold">R$ {data.profit.toFixed(2)}</p>
                </Card>
            </div>

            <Card>
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Lucratividade por Serviço</h3>
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={serviceProfitability} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }} labelStyle={{ color: '#f9fafb' }} />
                        <Legend />
                        <Bar dataKey="Lucro" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
            
            <Card>
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Últimos Lançamentos</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="p-3">Descrição</th>
                                <th className="p-3">Valor</th>
                                <th className="p-3">Tipo</th>
                                <th className="p-3">Serviço</th>
                                <th className="p-3">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {finances.slice(0, 5).map(f => (
                                <tr key={f.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-3">{f.description}</td>
                                    <td className={`p-3 font-semibold ${f.type === 'revenue' ? 'text-green-500' : 'text-red-500'}`}>
                                        R$ {f.amount.toFixed(2)}
                                    </td>
                                    <td className="p-3 capitalize">{f.type === 'revenue' ? 'Receita' : 'Despesa'}</td>
                                    <td className="p-3">{f.service || '-'}</td>
                                    <td className="p-3">
                                        <button onClick={() => handleDelete(f.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-full"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Lançamento Financeiro">
                <form onSubmit={handleAddFinance} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Tipo</label>
                        <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="revenue">Receita</option>
                            <option value="expense">Despesa</option>
                        </select>
                    </div>
                    <Input type="text" placeholder="Descrição (Ex: Corte de Cabelo)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required/>
                    <Input type="number" placeholder="Valor (Ex: 50.00)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required/>
                    <Input type="text" placeholder="Serviço Associado (Opcional)" value={form.service} onChange={e => setForm({...form, service: e.target.value})} />
                    <Button type="submit" className="w-full">Adicionar Lançamento</Button>
                </form>
            </Modal>
        </div>
    );
};


const PricingElite = () => {
    const [cost, setCost] = useState('');
    const [hours, setHours] = useState('');
    const [margin, setMargin] =useState(50); // 50% de margem
    const [price, setPrice] = useState(null);

    const calculatePrice = (e) => {
        e.preventDefault();
        const totalCost = parseFloat(cost) || 0;
        const totalHours = parseFloat(hours) || 1;
        const profitMargin = parseFloat(margin) / 100;
        
        // Exemplo de fórmula: Custo + (Custo * Margem de Lucro)
        // Uma fórmula mais complexa poderia incluir valor por hora, etc.
        const calculatedPrice = totalCost * (1 + profitMargin);
        setPrice(calculatedPrice);
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Precificação de Elite</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Calculadora de Preço Justo</h3>
                    <form onSubmit={calculatePrice} className="space-y-4">
                        <Input type="number" placeholder="Custo de materiais (R$)" value={cost} onChange={e => setCost(e.target.value)} required />
                        <Input type="number" placeholder="Horas gastas no serviço" value={hours} onChange={e => setHours(e.target.value)} required />
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Margem de Lucro Desejada: {margin}%</label>
                            <input type="range" min="10" max="200" value={margin} onChange={e => setMargin(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                        </div>
                        <Button type="submit" className="w-full">Calcular Preço</Button>
                    </form>
                    {price !== null && (
                        <div className="mt-6 p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-center">
                            <p className="font-semibold text-indigo-800 dark:text-indigo-200">Preço Sugerido:</p>
                            <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">R$ {price.toFixed(2)}</p>
                        </div>
                    )}
                </Card>
                <Card>
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Dicas para Aumentar Preços</h3>
                    <ul className="space-y-3 text-gray-600 dark:text-gray-300 list-disc list-inside">
                        <li><strong>Comunique o Valor:</strong> Antes de falar o preço, reforce os benefícios e a qualidade do seu serviço.</li>
                        <li><strong>Aviso Prévio:</strong> Informe seus clientes fiéis sobre o reajuste com antecedência.</li>
                        <li><strong>Agregue Valor:</strong> Ofereça um pequeno bônus ou melhoria no serviço junto com o novo preço.</li>
                        <li><strong>Mostre Confiança:</strong> Apresente o novo preço com segurança, sem pedir desculpas.</li>
                    </ul>
                </Card>
            </div>
        </div>
    );
};

const MarketingAI = () => {
    const [topic, setTopic] = useState('');
    const [generatedPost, setGeneratedPost] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const generatePost = async () => {
        if (!topic) return;
        setIsLoading(true);
        setError('');
        setGeneratedPost('');
        try {
            const prompt = `Crie uma legenda curta e magnética para um post de Instagram ou WhatsApp sobre "${topic}". Use emojis e uma linguagem que conecte com o público. Inclua uma chamada para ação clara.`;
            
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const apiKey = ""; 
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                setGeneratedPost(text);
            } else {
                throw new Error("Resposta da API inválida.");
            }
        } catch (e) {
            console.error(e);
            setError("Falha ao gerar o post. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const copyToClipboard = () => {
        const textarea = document.createElement('textarea');
        textarea.value = generatedPost;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Legenda copiada!');
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Marketing Magnético com IA</h2>
            <Card>
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">✨ Gerador de Posts</h3>
                    <p className="text-gray-600 dark:text-gray-300">Digite um tema e nossa IA criará uma legenda para suas redes sociais em segundos.</p>
                    <Input type="text" placeholder="Ex: Promoção de hidratação capilar" value={topic} onChange={e => setTopic(e.target.value)} />
                    <Button onClick={generatePost} disabled={isLoading} className="w-full">
                        {isLoading ? 'Gerando...' : 'Gerar Legenda com IA'}
                    </Button>
                </div>
                {error && <p className="text-red-500 mt-4">{error}</p>}
                {generatedPost && (
                    <div className="mt-6 space-y-4">
                        <h4 className="font-semibold dark:text-white">Resultado:</h4>
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg whitespace-pre-wrap font-mono text-sm">
                            {generatedPost}
                        </div>
                        <Button onClick={copyToClipboard} variant="secondary"><Copy size={16}/> Copiar Texto</Button>
                    </div>
                )}
            </Card>
        </div>
    );
};

const Scheduling = ({ userId }) => {
    const [appointments, setAppointments] = useState([]);
    const [clients, setClients] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ clientId: '', service: '', date: '', time: '' });
    
    // Fetch clients for the dropdown
    useEffect(() => {
        if (!userId) return;
        const q = query(collection(db, `/artifacts/${appId}/users/${userId}/clients`));
        const unsubscribe = onSnapshot(q, snapshot => {
            setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [userId]);
    
    // Fetch appointments
    useEffect(() => {
        if (!userId) return;
        const q = query(collection(db, `/artifacts/${appId}/users/${userId}/appointments`));
        const unsubscribe = onSnapshot(q, snapshot => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAppointments(data);
        });
        return () => unsubscribe();
    }, [userId]);
    
    const handleAddAppointment = async (e) => {
        e.preventDefault();
        if (!form.clientId || !form.service || !form.date || !form.time) return;
        const client = clients.find(c => c.id === form.clientId);
        await addDoc(collection(db, `/artifacts/${appId}/users/${userId}/appointments`), {
            ...form,
            clientName: client ? client.name : 'Desconhecido',
            status: 'Agendado'
        });
        setForm({ clientId: '', service: '', date: '', time: '' });
        setIsModalOpen(false);
    };

    const updateStatus = async (id, status) => {
        const docRef = doc(db, `/artifacts/${appId}/users/${userId}/appointments`, id);
        await updateDoc(docRef, { status });
    };

    const handleDelete = async (id) => {
        await deleteDoc(doc(db, `/artifacts/${appId}/users/${userId}/appointments`, id));
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Agendamento Inteligente</h2>
                <Button onClick={() => setIsModalOpen(true)}><Plus className="h-5 w-5" /> Novo Agendamento</Button>
            </div>
            <Card>
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Próximos Agendamentos</h3>
                <div className="space-y-4">
                    {appointments.map(apt => (
                        <div key={apt.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p className="font-bold">{apt.clientName} - <span className="font-normal">{apt.service}</span></p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(apt.date).toLocaleDateString()} às {apt.time}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <select value={apt.status} onChange={(e) => updateStatus(apt.id, e.target.value)} className="bg-transparent text-sm font-semibold rounded-md p-1 border-none focus:ring-0">
                                    <option value="Agendado">Agendado</option>
                                    <option value="Confirmado">Confirmado</option>
                                    <option value="Concluído">Concluído</option>
                                    <option value="Cancelado">Cancelado</option>
                                </select>
                                <button onClick={() => handleDelete(apt.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-full"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Agendamento">
                <form onSubmit={handleAddAppointment} className="space-y-4">
                    <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} required className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Selecione um Cliente</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <Input type="text" placeholder="Serviço" value={form.service} onChange={e => setForm({...form, service: e.target.value})} required />
                    <div className="flex gap-4">
                        <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                        <Input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} required />
                    </div>
                    <Button type="submit" className="w-full">Agendar</Button>
                </form>
            </Modal>
        </div>
    );
};

const ClientsVIP = ({ userId }) => {
    const [clients, setClients] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });

    useEffect(() => {
        if (!userId) return;
        const q = query(collection(db, `/artifacts/${appId}/users/${userId}/clients`));
        const unsubscribe = onSnapshot(q, snapshot => {
            setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [userId]);
    
    const handleOpenModal = (client = null) => {
        if (client) {
            setEditingClient(client);
            setForm(client);
        } else {
            setEditingClient(null);
            setForm({ name: '', phone: '', email: '', notes: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
        setForm({ name: '', phone: '', email: '', notes: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingClient) {
            const docRef = doc(db, `/artifacts/${appId}/users/${userId}/clients`, editingClient.id);
            await updateDoc(docRef, form);
        } else {
            await addDoc(collection(db, `/artifacts/${appId}/users/${userId}/clients`), { ...form });
        }
        handleCloseModal();
    };
    
    const handleDelete = async (id) => {
        await deleteDoc(doc(db, `/artifacts/${appId}/users/${userId}/clients`, id));
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Clientes VIP</h2>
                <Button onClick={() => handleOpenModal()}><Plus className="h-5 w-5" /> Novo Cliente</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map(client => (
                    <Card key={client.id}>
                        <div className="flex justify-between items-start">
                             <h3 className="text-xl font-bold text-gray-800 dark:text-white">{client.name}</h3>
                             <div className="flex gap-1">
                                <button onClick={() => handleOpenModal(client)} className="text-gray-400 hover:text-indigo-500 p-2 rounded-full"><Edit size={16}/></button>
                                <button onClick={() => handleDelete(client.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-full"><Trash2 size={16}/></button>
                             </div>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">{client.email}</p>
                        <p className="text-gray-500 dark:text-gray-400">{client.phone}</p>
                        <p className="mt-4 text-sm bg-yellow-100 dark:bg-yellow-900/50 p-3 rounded-lg">
                            <strong>Notas:</strong> {client.notes || 'Nenhuma nota.'}
                        </p>
                    </Card>
                ))}
            </div>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingClient ? "Editar Cliente" : "Novo Cliente"}>
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <Input type="text" placeholder="Nome completo" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required/>
                    <Input type="tel" placeholder="Telefone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                    <Input type="email" placeholder="E-mail" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                    <textarea placeholder="Pequenos detalhes que encantam... (Ex: prefere café sem açúcar)" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24" />
                    <Button type="submit" className="w-full">{editingClient ? 'Salvar Alterações' : 'Adicionar Cliente'}</Button>
                 </form>
            </Modal>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL ---
export default function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                     // Tenta usar o token injetado se disponível
                    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Authentication Error:", error);
                }
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    const renderContent = () => {
        if (!isAuthReady) {
            return <div className="text-center p-10">Carregando seu painel...</div>;
        }
        switch (activeTab) {
            case 'dashboard': return <FinancialDashboard userId={userId} />;
            case 'pricing': return <PricingElite />;
            case 'marketing': return <MarketingAI />;
            case 'scheduling': return <Scheduling userId={userId} />;
            case 'clients': return <ClientsVIP userId={userId} />;
            default: return <FinancialDashboard userId={userId} />;
        }
    };
    
    const NavLink = ({ id, children }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${activeTab === id ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            <div className="flex flex-col md:flex-row">
                <aside className="w-full md:w-64 bg-white dark:bg-gray-800 p-4 md:p-6 md:min-h-screen border-r border-gray-200 dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">GestãoPRO</h1>
                    <p className="text-xs text-gray-500 mb-6">User ID: <span className="font-mono">{userId || 'loading...'}</span></p>

                    <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
                        <NavLink id="dashboard">{ICONS.dashboard} Dashboard</NavLink>
                        <NavLink id="pricing">{ICONS.pricing} Precificação</NavLink>
                        <NavLink id="marketing">{ICONS.marketing} Marketing IA</NavLink>
                        <NavLink id="scheduling">{ICONS.scheduling} Agendamentos</NavLink>
                        <NavLink id="clients">{ICONS.clients} Clientes</NavLink>
                    </nav>
                </aside>
                <main className="flex-1 p-6 md:p-10">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}
