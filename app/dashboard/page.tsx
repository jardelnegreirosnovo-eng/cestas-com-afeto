'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ShoppingBag, Package, Users, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react'

interface DashboardStats {
  totalVendas: number
  receitaHoje: number
  receitaMes: number
  produtosBaixoEstoque: number
  totalClientes: number
  cestasAtivas: number
}

interface VendaRecente {
  id: string
  cliente_nome: string
  total: number
  created_at: string
  status: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVendas: 0,
    receitaHoje: 0,
    receitaMes: 0,
    produtosBaixoEstoque: 0,
    totalClientes: 0,
    cestasAtivas: 0,
  })
  const [vendasRecentes, setVendasRecentes] = useState<VendaRecente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

      const [vendasHoje, vendasMes, clientes, produtos, cestas, recentes] = await Promise.all([
        supabase.from('vendas').select('total').gte('created_at', hoje.toISOString()),
        supabase.from('vendas').select('total').gte('created_at', inicioMes.toISOString()),
        supabase.from('clientes').select('id', { count: 'exact', head: true }),
        supabase.from('produtos').select('id').lt('estoque_atual', 5),
        supabase.from('cestas').select('id', { count: 'exact', head: true }).eq('ativo', true),
        supabase.from('vendas').select('id, cliente_nome, total, created_at, status').order('created_at', { ascending: false }).limit(5),
      ])

      setStats({
        totalVendas: vendasMes.data?.length || 0,
        receitaHoje: (vendasHoje.data || []).reduce((acc, v) => acc + Number(v.total), 0),
        receitaMes: (vendasMes.data || []).reduce((acc, v) => acc + Number(v.total), 0),
        produtosBaixoEstoque: produtos.data?.length || 0,
        totalClientes: clientes.count || 0,
        cestasAtivas: cestas.count || 0,
      })
      setVendasRecentes(recentes.data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-rose-600">Cestas com Afeto</h1>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>
          <p className="text-xs text-gray-400">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: 'Hoje', value: fmt(stats.receitaHoje), color: 'border-rose-400', icon: <DollarSign className="w-4 h-4 text-rose-400" /> },
            { label: 'Mes', value: fmt(stats.receitaMes), color: 'border-pink-400', icon: <TrendingUp className="w-4 h-4 text-pink-400" /> },
            { label: 'Vendas/Mes', value: stats.totalVendas, color: 'border-purple-400', icon: <ShoppingBag className="w-4 h-4 text-purple-400" /> },
            { label: 'Clientes', value: stats.totalClientes, color: 'border-blue-400', icon: <Users className="w-4 h-4 text-blue-400" /> },
            { label: 'Cestas', value: stats.cestasAtivas, color: 'border-amber-400', icon: <Package className="w-4 h-4 text-amber-400" /> },
            { label: 'Estoque Baixo', value: stats.produtosBaixoEstoque, color: stats.produtosBaixoEstoque > 0 ? 'border-red-400' : 'border-green-400', icon: <AlertTriangle className={`w-4 h-4 ${stats.produtosBaixoEstoque > 0 ? 'text-red-400' : 'text-green-400'}`} /> },
          ].map((card) => (
            <div key={card.label} className={`bg-white rounded-2xl shadow-sm p-4 border-l-4 ${card.color}`}>
              <div className="flex items-center gap-2 mb-1">{card.icon}<span className="text-xs text-gray-500">{card.label}</span></div>
              <p className="text-lg font-bold text-gray-800">{card.value}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Acoes Rapidas</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link href="/vendas/nova" className="bg-rose-500 hover:bg-rose-600 text-white rounded-2xl p-4 flex flex-col items-center gap-2 transition-colors shadow-sm">
              <ShoppingBag className="w-6 h-6" /><span className="text-sm font-medium">Nova Venda</span>
            </Link>
            <Link href="/cestas" className="bg-pink-500 hover:bg-pink-600 text-white rounded-2xl p-4 flex flex-col items-center gap-2 transition-colors shadow-sm">
              <Package className="w-6 h-6" /><span className="text-sm font-medium">Cestas</span>
            </Link>
            <Link href="/produtos" className="bg-purple-500 hover:bg-purple-600 text-white rounded-2xl p-4 flex flex-col items-center gap-2 transition-colors shadow-sm">
              <Package className="w-6 h-6" /><span className="text-sm font-medium">Produtos</span>
            </Link>
            <Link href="/clientes" className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl p-4 flex flex-col items-center gap-2 transition-colors shadow-sm">
              <Users className="w-6 h-6" /><span className="text-sm font-medium">Clientes</span>
            </Link>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Vendas Recentes</h2>
            <Link href="/vendas" className="text-rose-500 text-sm hover:underline">Ver todas</Link>
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {vendasRecentes.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma venda ainda</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {vendasRecentes.map((v) => (
                  <li key={v.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{v.cliente_nome}</p>
                      <p className="text-xs text-gray-400">{fmtDate(v.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{fmt(Number(v.total))}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        v.status === 'pago' ? 'bg-green-100 text-green-600' :
                        v.status === 'pendente' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
                      }`}>{v.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-10">
        <div className="max-w-7xl mx-auto flex justify-around py-2">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 px-4 py-1 text-rose-500">
            <TrendingUp className="w-5 h-5" /><span className="text-xs">Inicio</span>
          </Link>
          <Link href="/vendas" className="flex flex-col items-center gap-1 px-4 py-1 text-gray-400">
            <ShoppingBag className="w-5 h-5" /><span className="text-xs">Vendas</span>
          </Link>
          <Link href="/cestas" className="flex flex-col items-center gap-1 px-4 py-1 text-gray-400">
            <Package className="w-5 h-5" /><span className="text-xs">Cestas</span>
          </Link>
          <Link href="/clientes" className="flex flex-col items-center gap-1 px-4 py-1 text-gray-400">
            <Users className="w-5 h-5" /><span className="text-xs">Clientes</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
