'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Plus, Search, Users, Phone, Edit, Trash2, MessageCircle } from 'lucide-react'
import { gerarMensagemWhatsApp } from '@/lib/whatsapp'

interface Cliente {
  id: string
  nome: string
  telefone: string
  email: string
  endereco: string
  observacoes: string
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', endereco: '', observacoes: '' })

  useEffect(() => { fetchClientes() }, [])

  async function fetchClientes() {
    setLoading(true)
    const { data } = await supabase.from('clientes').select('*').order('nome')
    setClientes(data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (editingCliente) {
      await supabase.from('clientes').update(form).eq('id', editingCliente.id)
    } else {
      await supabase.from('clientes').insert(form)
    }
    setShowForm(false)
    setEditingCliente(null)
    setForm({ nome: '', telefone: '', email: '', endereco: '', observacoes: '' })
    fetchClientes()
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir este cliente?')) return
    await supabase.from('clientes').delete().eq('id', id)
    fetchClientes()
  }

  function handleEdit(c: Cliente) {
    setEditingCliente(c)
    setForm({ nome: c.nome, telefone: c.telefone || '', email: c.email || '', endereco: c.endereco || '', observacoes: c.observacoes || '' })
    setShowForm(true)
  }

  function handleWhatsApp(c: Cliente) {
    const msg = gerarMensagemWhatsApp('saudacao', { nomeCliente: c.nome })
    const tel = c.telefone.replace(/\D/g, '')
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const filtered = clientes.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()) || (c.telefone && c.telefone.includes(search)))

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-lg font-bold text-gray-800 flex-1">Clientes</h1>
          <button onClick={() => { setShowForm(true); setEditingCliente(null); setForm({ nome: '', telefone: '', email: '', endereco: '', observacoes: '' }) }}
            className="bg-rose-500 text-white rounded-xl px-3 py-2 flex items-center gap-1 text-sm">
            <Plus className="w-4 h-4" /> Novo
          </button>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          </div>
        </div>
      </header>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800">{editingCliente ? 'Editar Cliente' : 'Novo Cliente'}</h2>
            <div className="space-y-3">
              <input placeholder="Nome *" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              <input placeholder="Telefone (WhatsApp)" type="tel" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              <input placeholder="Endereco" value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              <textarea placeholder="Observacoes" value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowForm(false); setEditingCliente(null) }}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600">Cancelar</button>
              <button onClick={handleSave} className="flex-1 bg-rose-500 text-white rounded-xl py-2.5 text-sm font-medium">
                {editingCliente ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => (
              <div key={c.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800">{c.nome}</h3>
                    {c.telefone && (
                      <div className="flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-500">{c.telefone}</span>
                      </div>
                    )}
                    {c.email && <p className="text-xs text-gray-400 mt-0.5">{c.email}</p>}
                    {c.observacoes && <p className="text-xs text-gray-400 mt-1 italic">{c.observacoes}</p>}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {c.telefone && (
                      <button onClick={() => handleWhatsApp(c)} className="p-2 text-green-500 hover:bg-green-50 rounded-xl">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleEdit(c)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl">
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
