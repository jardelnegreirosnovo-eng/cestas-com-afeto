'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Minus, ShoppingBag, Check } from 'lucide-react'

interface Cesta {
  id: string
  nome: string
  preco_venda: number
  descricao: string
  cesta_itens?: { produto_id: string; quantidade: number }[]
}

interface ItemVenda {
  cesta_id: string
  cesta_nome: string
  quantidade: number
  preco_unitario: number
}

export default function NovaVendaPage() {
  const router = useRouter()
  const [cestas, setCestas] = useState<Cesta[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [itens, setItens] = useState<ItemVenda[]>([])
  const [form, setForm] = useState({
    cliente_nome: '',
    cliente_telefone: '',
    forma_pagamento: 'pix',
    status: 'pago',
    observacoes: '',
  })

  useEffect(() => { fetchCestas() }, [])

  async function fetchCestas() {
    const { data } = await supabase
      .from('cestas')
      .select('*, cesta_itens(produto_id, quantidade)')
      .eq('ativo', true)
      .order('nome')
    setCestas(data || [])
    setLoading(false)
  }

  function addItem(cesta: Cesta) {
    setItens(prev => {
      const existing = prev.find(i => i.cesta_id === cesta.id)
      if (existing) {
        return prev.map(i => i.cesta_id === cesta.id ? { ...i, quantidade: i.quantidade + 1 } : i)
      }
      return [...prev, { cesta_id: cesta.id, cesta_nome: cesta.nome, quantidade: 1, preco_unitario: cesta.preco_venda }]
    })
  }

  function removeItem(cestaId: string) {
    setItens(prev => {
      const existing = prev.find(i => i.cesta_id === cestaId)
      if (!existing) return prev
      if (existing.quantidade <= 1) return prev.filter(i => i.cesta_id !== cestaId)
      return prev.map(i => i.cesta_id === cestaId ? { ...i, quantidade: i.quantidade - 1 } : i)
    })
  }

  const total = itens.reduce((acc, i) => acc + i.preco_unitario * i.quantidade, 0)

  async function calcularCusto() {
    let custo = 0
    for (const item of itens) {
      const cesta = cestas.find(c => c.id === item.cesta_id)
      if (!cesta?.cesta_itens) continue
      for (const ci of cesta.cesta_itens) {
        const { data: produto } = await supabase.from('produtos').select('preco_custo').eq('id', ci.produto_id).single()
        if (produto) custo += produto.preco_custo * ci.quantidade * item.quantidade
      }
    }
    return custo
  }

  async function handleSave() {
    if (!form.cliente_nome || itens.length === 0) {
      alert('Informe o nome do cliente e adicione ao menos uma cesta.')
      return
    }
    setSaving(true)
    try {
      const custo = await calcularCusto()
      const lucro = total - custo

      const { data: venda, error } = await supabase
        .from('vendas')
        .insert({
          cliente_nome: form.cliente_nome,
          cliente_telefone: form.cliente_telefone,
          total,
          custo,
          lucro,
          forma_pagamento: form.forma_pagamento,
          status: form.status,
          observacoes: form.observacoes,
        })
        .select()
        .single()

      if (error || !venda) throw error

      await supabase.from('venda_itens').insert(
        itens.map(i => ({
          venda_id: venda.id,
          cesta_id: i.cesta_id,
          cesta_nome: i.cesta_nome,
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
        }))
      )

      for (const item of itens) {
        const cesta = cestas.find(c => c.id === item.cesta_id)
        if (!cesta?.cesta_itens) continue
        for (const ci of cesta.cesta_itens) {
          const qtdTotal = ci.quantidade * item.quantidade
          await supabase.rpc('decrementar_estoque', { p_produto_id: ci.produto_id, p_quantidade: qtdTotal })
        }
      }

      router.push('/vendas')
    } catch (err) {
      console.error(err)
      alert('Erro ao registrar venda. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/vendas" className="text-gray-400"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-lg font-bold text-gray-800">Nova Venda</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h2 className="font-semibold text-gray-700 text-sm">Dados do Cliente</h2>
          <input placeholder="Nome do cliente *" value={form.cliente_nome} onChange={e => setForm({...form, cliente_nome: e.target.value})}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          <input placeholder="Telefone (WhatsApp)" type="tel" value={form.cliente_telefone} onChange={e => setForm({...form, cliente_telefone: e.target.value})}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.forma_pagamento} onChange={e => setForm({...form, forma_pagamento: e.target.value})}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
              <option value="pix">PIX</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao_credito">Cartao Credito</option>
              <option value="cartao_debito">Cartao Debito</option>
              <option value="transferencia">Transferencia</option>
            </select>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>
          <textarea placeholder="Observacoes" value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-700 text-sm mb-3">Cestas</h2>
          {loading ? (
            <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-500" /></div>
          ) : cestas.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              <p>Nenhuma cesta ativa.</p>
              <Link href="/cestas" className="text-rose-500 underline">Criar cesta</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {cestas.map(c => {
                const item = itens.find(i => i.cesta_id === c.id)
                return (
                  <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm">{c.nome}</p>
                      <p className="text-xs text-rose-600">{fmt(c.preco_venda)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item ? (
                        <>
                          <button onClick={() => removeItem(c.id)} className="w-7 h-7 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-gray-800 text-sm">{item.quantidade}</span>
                          <button onClick={() => addItem(c)} className="w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center">
                            <Plus className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => addItem(c)} className="bg-rose-500 text-white rounded-xl px-3 py-1.5 text-xs font-medium flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Adicionar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {itens.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-700 text-sm mb-3">Resumo</h2>
            <div className="space-y-1">
              {itens.map(i => (
                <div key={i.cesta_id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{i.cesta_nome} x{i.quantidade}</span>
                  <span className="font-medium text-gray-800">{fmt(i.preco_unitario * i.quantidade)}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                <span className="font-bold text-gray-800">Total</span>
                <span className="font-bold text-rose-600 text-lg">{fmt(total)}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-lg">
        <button onClick={handleSave} disabled={saving || itens.length === 0}
          className="w-full bg-rose-500 disabled:bg-gray-300 text-white rounded-2xl py-3.5 font-bold text-base flex items-center justify-center gap-2 transition-colors">
          {saving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <><Check className="w-5 h-5" /> Finalizar Venda {total > 0 && fmt(total)}</>
          )}
        </button>
      </div>
    </div>
  )
}
