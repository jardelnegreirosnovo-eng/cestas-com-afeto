'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Plus, Package, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface Produto { id: string; nome: string; preco_custo: number; unidade: string }
interface ItemCesta { produto_id: string; quantidade: number; nome?: string; preco_custo?: number }
interface Cesta {
  id: string
  nome: string
  descricao: string
  preco_venda: number
  ativo: boolean
  cesta_itens?: ItemCesta[]
}

export default function CestasPage() {
  const [cestas, setCestas] = useState<Cesta[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCesta, setEditingCesta] = useState<Cesta | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState({ nome: '', descricao: '', preco_venda: '' })
  const [itens, setItens] = useState<ItemCesta[]>([])

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('cestas').select('*, cesta_itens(produto_id, quantidade)').order('nome'),
      supabase.from('produtos').select('id, nome, preco_custo, unidade').order('nome'),
    ])
    setCestas(c || [])
    setProdutos(p || [])
    setLoading(false)
  }

  async function handleSave() {
    const payload = {
      nome: form.nome,
      descricao: form.descricao,
      preco_venda: parseFloat(form.preco_venda) || 0,
      ativo: true,
    }
    let cestaId = editingCesta?.id
    if (editingCesta) {
      await supabase.from('cestas').update(payload).eq('id', editingCesta.id)
      await supabase.from('cesta_itens').delete().eq('cesta_id', editingCesta.id)
    } else {
      const { data } = await supabase.from('cestas').insert(payload).select().single()
      cestaId = data?.id
    }
    if (cestaId && itens.length > 0) {
      await supabase.from('cesta_itens').insert(
        itens.filter(i => i.quantidade > 0).map(i => ({ cesta_id: cestaId, produto_id: i.produto_id, quantidade: i.quantidade }))
      )
    }
    setShowForm(false)
    setEditingCesta(null)
    setForm({ nome: '', descricao: '', preco_venda: '' })
    setItens([])
    fetchData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir esta cesta?')) return
    await supabase.from('cesta_itens').delete().eq('cesta_id', id)
    await supabase.from('cestas').delete().eq('id', id)
    fetchData()
  }

  function handleEdit(c: Cesta) {
    setEditingCesta(c)
    setForm({ nome: c.nome, descricao: c.descricao || '', preco_venda: String(c.preco_venda) })
    setItens((c.cesta_itens || []).map(i => ({ produto_id: i.produto_id, quantidade: i.quantidade })))
    setShowForm(true)
  }

  function updateItem(produto_id: string, quantidade: number) {
    setItens(prev => {
      const existing = prev.find(i => i.produto_id === produto_id)
      if (existing) return prev.map(i => i.produto_id === produto_id ? { ...i, quantidade } : i)
      return [...prev, { produto_id, quantidade }]
    })
  }

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const calcCusto = (c: Cesta) => {
    return (c.cesta_itens || []).reduce((acc, item) => {
      const prod = produtos.find(p => p.id === item.produto_id)
      return acc + (prod?.preco_custo || 0) * item.quantidade
    }, 0)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-lg font-bold text-gray-800 flex-1">Cestas</h1>
          <button onClick={() => { setShowForm(true); setEditingCesta(null); setForm({ nome: '', descricao: '', preco_venda: '' }); setItens([]) }}
            className="bg-rose-500 text-white rounded-xl px-3 py-2 flex items-center gap-1 text-sm">
            <Plus className="w-4 h-4" /> Nova
          </button>
        </div>
      </header>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800">{editingCesta ? 'Editar Cesta' : 'Nova Cesta'}</h2>
            <div className="space-y-3">
              <input placeholder="Nome da cesta *" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              <input placeholder="Descricao" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              <input placeholder="Preco de venda" type="number" step="0.01" value={form.preco_venda} onChange={e => setForm({...form, preco_venda: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Produtos na Cesta</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {produtos.map(p => {
                    const item = itens.find(i => i.produto_id === p.id)
                    return (
                      <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                        <div>
                          <p className="text-sm text-gray-700">{p.nome}</p>
                          <p className="text-xs text-gray-400">{fmt(p.preco_custo)}/{p.unidade}</p>
                        </div>
                        <input type="number" min="0" placeholder="0" value={item?.quantidade || ''}
                          onChange={e => updateItem(p.id, parseInt(e.target.value) || 0)}
                          className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-rose-300" />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowForm(false); setEditingCesta(null) }}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600">Cancelar</button>
              <button onClick={handleSave} className="flex-1 bg-rose-500 text-white rounded-xl py-2.5 text-sm font-medium">
                {editingCesta ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" /></div>
        ) : cestas.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma cesta cadastrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cestas.map(c => (
              <div key={c.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{c.nome}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${c.ativo ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                          {c.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      {c.descricao && <p className="text-xs text-gray-400 mt-0.5">{c.descricao}</p>}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500">Custo: <span className="font-medium text-gray-700">{fmt(calcCusto(c))}</span></span>
                        <span className="text-xs text-gray-500">Venda: <span className="font-medium text-rose-600">{fmt(c.preco_venda)}</span></span>
                        <span className="text-xs text-gray-500">Lucro: <span className="font-medium text-green-600">{fmt(c.preco_venda - calcCusto(c))}</span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button onClick={() => setExpanded(expanded === c.id ? null : c.id)} className="p-2 text-gray-400">
                        {expanded === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleEdit(c)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                {expanded === c.id && (c.cesta_itens || []).length > 0 && (
                  <div className="border-t border-gray-50 px-4 py-3 space-y-1">
                    <p className="text-xs font-medium text-gray-500 mb-2">Composicao:</p>
                    {(c.cesta_itens || []).map(item => {
                      const prod = produtos.find(p => p.id === item.produto_id)
                      return (
                        <div key={item.produto_id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{prod?.nome || item.produto_id}</span>
                          <span className="text-gray-500">{item.quantidade} {prod?.unidade}</span>
                        </div>
                      )
                    })}
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
