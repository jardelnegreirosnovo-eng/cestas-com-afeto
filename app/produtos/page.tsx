'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Plus, Search, Package, Edit, Trash2 } from 'lucide-react'

interface Produto {
  id: string
  nome: string
  descricao: string
  preco_custo: number
  preco_venda: number
  estoque_atual: number
  estoque_minimo: number
  unidade: string
  ativo: boolean
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [form, setForm] = useState({
    nome: '', descricao: '', preco_custo: '', preco_venda: '',
    estoque_atual: '', estoque_minimo: '5', unidade: 'un',
  })

  useEffect(() => { fetchProdutos() }, [])

  async function fetchProdutos() {
    setLoading(true)
    const { data } = await supabase.from('produtos').select('*').order('nome')
    setProdutos(data || [])
    setLoading(false)
  }

  async function handleSave() {
    const payload = {
      nome: form.nome,
      descricao: form.descricao,
      preco_custo: parseFloat(form.preco_custo) || 0,
      preco_venda: parseFloat(form.preco_venda) || 0,
      estoque_atual: parseInt(form.estoque_atual) || 0,
      estoque_minimo: parseInt(form.estoque_minimo) || 5,
      unidade: form.unidade,
      ativo: true,
    }
    if (editingProduto) {
      await supabase.from('produtos').update(payload).eq('id', editingProduto.id)
    } else {
      await supabase.from('produtos').insert(payload)
    }
    setShowForm(false)
    setEditingProduto(null)
    setForm({ nome: '', descricao: '', preco_custo: '', preco_venda: '', estoque_atual: '', estoque_minimo: '5', unidade: 'un' })
    fetchProdutos()
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir este produto?')) return
    await supabase.from('produtos').delete().eq('id', id)
    fetchProdutos()
  }

  function handleEdit(p: Produto) {
    setEditingProduto(p)
    setForm({
      nome: p.nome, descricao: p.descricao || '',
      preco_custo: String(p.preco_custo), preco_venda: String(p.preco_venda),
      estoque_atual: String(p.estoque_atual), estoque_minimo: String(p.estoque_minimo),
      unidade: p.unidade,
    })
    setShowForm(true)
  }

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  const filtered = produtos.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-800 flex-1">Produtos</h1>
          <button onClick={() => { setShowForm(true); setEditingProduto(null); setForm({ nome: '', descricao: '', preco_custo: '', preco_venda: '', estoque_atual: '', estoque_minimo: '5', unidade: 'un' }) }}
            className="bg-rose-500 text-white rounded-xl px-3 py-2 flex items-center gap-1 text-sm">
            <Plus className="w-4 h-4" /> Novo
          </button>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          </div>
        </div>
      </header>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800">{editingProduto ? 'Editar Produto' : 'Novo Produto'}</h2>
            <div className="space-y-3">
              <input placeholder="Nome do produto *" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              <input placeholder="Descricao" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Preco de custo" type="number" step="0.01" value={form.preco_custo} onChange={e => setForm({...form, preco_custo: e.target.value})}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                <input placeholder="Preco de venda" type="number" step="0.01" value={form.preco_venda} onChange={e => setForm({...form, preco_venda: e.target.value})}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input placeholder="Estoque" type="number" value={form.estoque_atual} onChange={e => setForm({...form, estoque_atual: e.target.value})}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                <input placeholder="Minimo" type="number" value={form.estoque_minimo} onChange={e => setForm({...form, estoque_minimo: e.target.value})}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                <select value={form.unidade} onChange={e => setForm({...form, unidade: e.target.value})}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
                  <option value="un">un</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="l">l</option>
                  <option value="ml">ml</option>
                  <option value="cx">cx</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowForm(false); setEditingProduto(null) }}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600">Cancelar</button>
              <button onClick={handleSave} className="flex-1 bg-rose-500 text-white rounded-xl py-2.5 text-sm font-medium">
                {editingProduto ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 truncate">{p.nome}</h3>
                      {p.estoque_atual <= p.estoque_minimo && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full shrink-0">Baixo</span>
                      )}
                    </div>
                    {p.descricao && <p className="text-xs text-gray-400 mt-0.5 truncate">{p.descricao}</p>}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">Custo: <span className="font-medium text-gray-700">{fmt(p.preco_custo)}</span></span>
                      <span className="text-xs text-gray-500">Venda: <span className="font-medium text-rose-600">{fmt(p.preco_venda)}</span></span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">Estoque: <span className={`font-medium ${p.estoque_atual <= p.estoque_minimo ? 'text-red-600' : 'text-green-600'}`}>{p.estoque_atual} {p.unidade}</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button onClick={() => handleEdit(p)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 rounded-xl hover:bg-red-50 text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
