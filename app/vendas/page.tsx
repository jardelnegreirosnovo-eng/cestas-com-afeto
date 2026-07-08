'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Plus, ShoppingBag, MessageCircle, Filter } from 'lucide-react'
import { gerarMensagemWhatsApp } from '@/lib/whatsapp'

interface Venda {
  id: string
  cliente_nome: string
  cliente_telefone: string
  total: number
  lucro: number
  status: string
  forma_pagamento: string
  observacoes: string
  created_at: string
  venda_itens?: { cesta_nome: string; quantidade: number; preco_unitario: number }[]
}

export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { fetchVendas() }, [filtroStatus])

  async function fetchVendas() {
    setLoading(true)
    let query = supabase
      .from('vendas')
      .select('*, venda_itens(cesta_nome, quantidade, preco_unitario)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (filtroStatus !== 'todos') {
      query = query.eq('status', filtroStatus)
    }

    const { data } = await query
    setVendas(data || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('vendas').update({ status }).eq('id', id)
    fetchVendas()
  }

  function handleWhatsApp(v: Venda) {
    if (!v.cliente_telefone) return
    const msg = gerarMensagemWhatsApp('confirmacao', {
      nomeCliente: v.cliente_nome,
      total: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v.total),
    })
    const tel = v.cliente_telefone.replace(/\D/g, '')
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

  const statusColors: Record<string, string> = {
    pago: 'bg-green-100 text-green-700',
    pendente: 'bg-amber-100 text-amber-700',
    cancelado: 'bg-red-100 text-red-700',
  }

  const totalFiltrado = vendas.reduce((acc, v) => acc + Number(v.total), 0)
  const lucroFiltrado = vendas.reduce((acc, v) => acc + Number(v.lucro || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-lg font-bold text-gray-800 flex-1">Vendas</h1>
          <Link href="/vendas/nova" className="bg-rose-500 text-white rounded-xl px-3 py-2 flex items-center gap-1 text-sm">
            <Plus className="w-4 h-4" /> Nova
          </Link>
        </div>
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
          {['todos', 'pendente', 'pago', 'cancelado'].map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filtroStatus === s ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {vendas.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-xs text-gray-500">Total</p>
            <p className="font-bold text-gray-800">{fmt(totalFiltrado)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-xs text-gray-500">Lucro</p>
            <p className="font-bold text-green-600">{fmt(lucroFiltrado)}</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-2">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" /></div>
        ) : vendas.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma venda encontrada</p>
            <Link href="/vendas/nova" className="mt-3 inline-block bg-rose-500 text-white rounded-xl px-4 py-2 text-sm">Registrar venda</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {vendas.map(v => (
              <div key={v.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 cursor-pointer" onClick={() => setExpanded(expanded === v.id ? null : v.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{v.cliente_nome}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[v.status] || 'bg-gray-100 text-gray-500'}`}>{v.status}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(v.created_at)} · {v.forma_pagamento}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-bold text-gray-800">{fmt(Number(v.total))}</span>
                        {v.lucro && <span className="text-xs text-green-600">Lucro: {fmt(Number(v.lucro))}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {v.cliente_telefone && (
                        <button onClick={e => { e.stopPropagation(); handleWhatsApp(v) }} className="p-2 text-green-500 hover:bg-green-50 rounded-xl">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {expanded === v.id && (
                  <div className="border-t border-gray-50 px-4 py-3 space-y-2">
                    {(v.venda_itens || []).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{item.cesta_nome} x{item.quantidade}</span>
                        <span className="text-gray-700 font-medium">{fmt(item.preco_unitario * item.quantidade)}</span>
                      </div>
                    ))}
                    {v.observacoes && <p className="text-xs text-gray-400 italic">{v.observacoes}</p>}
                    {v.status === 'pendente' && (
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => updateStatus(v.id, 'pago')} className="flex-1 bg-green-500 text-white rounded-xl py-2 text-sm">Marcar Pago</button>
                        <button onClick={() => updateStatus(v.id, 'cancelado')} className="flex-1 bg-red-100 text-red-600 rounded-xl py-2 text-sm">Cancelar</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
