'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')
    const [loading, setLoading] = useState(false)
    const [erro, setErro] = useState('')
    const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) { setErro('Email ou senha incorretos.'); setLoading(false) }
        else { router.push('/dashboard') }
      }

  return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-amber-50 px-4">
                <div className="w-full max-w-sm">
                          <div className="text-center mb-8">
                                      <div className="text-6xl mb-3">&#x1F9FA;</div>
                                      <h1 className="text-2xl font-bold text-pink-700">Cestas com Afeto</h1>
                                      <p className="text-sm text-gray-500">Gestao de Vendas e Estoque</p>
                                    </div>
                          <div className="bg-white rounded-3xl shadow-lg border border-pink-100 p-8">
                                      <h2 className="text-lg font-semibold mb-6 text-center">Entrar no sistema</h2>
                                      <form onSubmit={handleLogin} className="space-y-4">
                                                    <div><label className="label">Email</label><input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                                                    <div><label className="label">Senha</label><input type="password" className="input" value={senha} onChange={e => setSenha(e.target.value)} required /></div>
                                                    {erro && <p className="text-red-500 text-sm">{erro}</p>}
                                                    <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Entrando...' : 'Entrar'}</button>
                                                  </form>
                                    </div>
                        </div>
              </div>
      )
  }
