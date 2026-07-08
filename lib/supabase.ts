import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export type Categoria = {
  id: string
  nome: string
  descricao?: string
  cor: string
  criado_em: string
}

export type Produto = {
  id: string
  nome: string
  categoria_id?: string
  tags: string[]
  codigo_barras?: string
  foto_url?: string
  quantidade_estoque: number
  estoque_minimo: number
  unidade_medida: string
  preco_custo: number
  preco_venda_sugerido: number
  fornecedor?: string
  data_compra?: string
  data_validade?: string
  observacoes?: string
  status: 'ativo' | 'inativo' | 'descontinuado'
  criado_em: string
  atualizado_em: string
  categorias?: Categoria
}

export type Cliente = {
  id: string
  nome: string
  telefone?: string
  whatsapp?: string
  endereco?: string
  bairro?: string
  cidade?: string
  referencia?: string
  data_nascimento?: string
  preferencias?: string
  restricoes?: string
  observacoes?: string
  criado_em: string
}

export type CestaItem = {
  id: string
  cesta_id: string
  produto_id: string
  quantidade: number
  preco_custo_unitario: number
  custo_total_item: number
  produtos?: Produto
}

export type Cesta = {
  id: string
  nome: string
  descricao?: string
  foto_url?: string
  custo_total: number
  valor_venda: number
  lucro_valor: number
  lucro_percentual: number
  status: 'rascunho' | 'pronta' | 'vendida' | 'cancelada' | 'entregue'
  criado_em: string
  atualizado_em: string
  cesta_itens?: CestaItem[]
}

export type Venda = {
  id: string
  numero_venda: number
  cliente_id?: string
  cesta_id?: string
  data_venda: string
  valor_custo: number
  valor_venda: number
  lucro_valor: number
  lucro_percentual: number
  forma_pagamento: string
  status_pagamento: string
  status_entrega: string
  endereco_entrega?: string
  mensagem_cartao?: string
  observacoes?: string
  criado_em: string
  clientes?: Cliente
  cestas?: Cesta
}

export type MovimentacaoEstoque = {
  id: string
  produto_id: string
  tipo_movimentacao: 'entrada' | 'saida' | 'ajuste' | 'descarte' | 'perda'
  quantidade: number
  motivo?: string
  venda_id?: string
  data_movimentacao: string
  observacoes?: string
}

export type FluxoCaixa = {
  id: string
  tipo: 'entrada' | 'saida'
  categoria?: string
  descricao: string
  valor: number
  data: string
  venda_id?: string
  forma_pagamento?: string
  observacoes?: string
  criado_em: string
}

export type Encomenda = {
  id: string
  cliente_id?: string
  cesta_id?: string
  data_pedido: string
  data_entrega?: string
  horario_entrega?: string
  mensagem_personalizada?: string
  endereco_entrega?: string
  status: string
  valor_total: number
  status_pagamento: string
  observacoes?: string
  clientes?: Cliente
  cestas?: Cesta
}
