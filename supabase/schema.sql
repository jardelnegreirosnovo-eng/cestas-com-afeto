-- ============================================
-- CESTAS COM AFETO - Schema Supabase/PostgreSQL
-- ============================================

-- CATEGORIAS
create table if not exists categorias (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  descricao text,
  cor text default '#f59e0b',
  criado_em timestamptz default now()
);

-- PRODUTOS
create table if not exists produtos (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  categoria_id uuid references categorias(id) on delete set null,
  tags text[] default '{}',
  codigo_barras text,
  foto_url text,
  quantidade_estoque numeric default 0,
  estoque_minimo numeric default 5,
  unidade_medida text default 'un',
  preco_custo numeric not null default 0,
  preco_venda_sugerido numeric default 0,
  fornecedor text,
  data_compra date,
  data_validade date,
  observacoes text,
  status text default 'ativo' check (status in ('ativo','inativo','descontinuado')),
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- CLIENTES
create table if not exists clientes (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  telefone text,
  whatsapp text,
  endereco text,
  bairro text,
  cidade text default 'Boa Viagem',
  referencia text,
  data_nascimento date,
  preferencias text,
  restricoes text,
  observacoes text,
  criado_em timestamptz default now()
);

-- CESTAS
create table if not exists cestas (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  descricao text,
  foto_url text,
  custo_total numeric default 0,
  valor_venda numeric default 0,
  lucro_valor numeric generated always as (valor_venda - custo_total) stored,
  lucro_percentual numeric generated always as (
    case when custo_total > 0 then ((valor_venda - custo_total) / custo_total * 100) else 0 end
  ) stored,
  status text default 'rascunho' check (status in ('rascunho','pronta','vendida','cancelada','entregue')),
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- ITENS DA CESTA
create table if not exists cesta_itens (
  id uuid default gen_random_uuid() primary key,
  cesta_id uuid references cestas(id) on delete cascade,
  produto_id uuid references produtos(id) on delete restrict,
  quantidade numeric not null default 1,
  preco_custo_unitario numeric not null default 0,
  custo_total_item numeric generated always as (quantidade * preco_custo_unitario) stored
);

-- VENDAS
create table if not exists vendas (
  id uuid default gen_random_uuid() primary key,
  numero_venda bigint generated always as identity,
  cliente_id uuid references clientes(id) on delete set null,
  cesta_id uuid references cestas(id) on delete set null,
  data_venda timestamptz default now(),
  valor_custo numeric default 0,
  valor_venda numeric not null,
  lucro_valor numeric generated always as (valor_venda - valor_custo) stored,
  lucro_percentual numeric generated always as (
    case when valor_custo > 0 then ((valor_venda - valor_custo) / valor_custo * 100) else 0 end
  ) stored,
  forma_pagamento text default 'pix' check (forma_pagamento in ('pix','dinheiro','credito','debito','transferencia','fiado','outro')),
  status_pagamento text default 'pendente' check (status_pagamento in ('pendente','pago','parcial','cancelado')),
  status_entrega text default 'pendente' check (status_entrega in ('pendente','preparacao','saiu','entregue','cancelada')),
  endereco_entrega text,
  mensagem_cartao text,
  observacoes text,
  criado_em timestamptz default now()
);

-- MOVIMENTACOES DE ESTOQUE
create table if not exists movimentacoes_estoque (
  id uuid default gen_random_uuid() primary key,
  produto_id uuid references produtos(id) on delete cascade,
  tipo_movimentacao text not null check (tipo_movimentacao in ('entrada','saida','ajuste','descarte','perda')),
  quantidade numeric not null,
  motivo text,
  venda_id uuid references vendas(id) on delete set null,
  data_movimentacao timestamptz default now(),
  observacoes text
);

-- FLUXO DE CAIXA
create table if not exists fluxo_caixa (
  id uuid default gen_random_uuid() primary key,
  tipo text not null check (tipo in ('entrada','saida')),
  categoria text,
  descricao text not null,
  valor numeric not null,
  data date default current_date,
  venda_id uuid references vendas(id) on delete set null,
  forma_pagamento text,
  observacoes text,
  criado_em timestamptz default now()
);

-- ENCOMENDAS
create table if not exists encomendas (
  id uuid default gen_random_uuid() primary key,
  cliente_id uuid references clientes(id) on delete set null,
  cesta_id uuid references cestas(id) on delete set null,
  data_pedido timestamptz default now(),
  data_entrega date,
  horario_entrega time,
  mensagem_personalizada text,
  endereco_entrega text,
  status text default 'recebido' check (status in ('recebido','confirmado','producao','pronto','saiu','entregue','cancelado')),
  valor_total numeric default 0,
  status_pagamento text default 'pendente' check (status_pagamento in ('pendente','pago','parcial','cancelado')),
  observacoes text
);

-- CONFIGURACOES
create table if not exists configuracoes (
  id uuid default gen_random_uuid() primary key,
  chave text unique not null,
  valor text,
  atualizado_em timestamptz default now()
);

-- ============================================
-- RLS - Row Level Security
-- ============================================
alter table categorias enable row level security;
alter table produtos enable row level security;
alter table clientes enable row level security;
alter table cestas enable row level security;
alter table cesta_itens enable row level security;
alter table vendas enable row level security;
alter table movimentacoes_estoque enable row level security;
alter table fluxo_caixa enable row level security;
alter table encomendas enable row level security;
alter table configuracoes enable row level security;

-- Politicas para usuarios autenticados
create policy "auth_all_categorias" on categorias for all to authenticated using (true) with check (true);
create policy "auth_all_produtos" on produtos for all to authenticated using (true) with check (true);
create policy "auth_all_clientes" on clientes for all to authenticated using (true) with check (true);
create policy "auth_all_cestas" on cestas for all to authenticated using (true) with check (true);
create policy "auth_all_cesta_itens" on cesta_itens for all to authenticated using (true) with check (true);
create policy "auth_all_vendas" on vendas for all to authenticated using (true) with check (true);
create policy "auth_all_mov_estoque" on movimentacoes_estoque for all to authenticated using (true) with check (true);
create policy "auth_all_fluxo" on fluxo_caixa for all to authenticated using (true) with check (true);
create policy "auth_all_encomendas" on encomendas for all to authenticated using (true) with check (true);
create policy "auth_all_config" on configuracoes for all to authenticated using (true) with check (true);

-- ============================================
-- FUNCOES E TRIGGERS
-- ============================================

-- Atualiza campo atualizado_em automaticamente
create or replace function update_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger trg_produtos_atualizado_em
  before update on produtos
  for each row execute function update_atualizado_em();

create trigger trg_cestas_atualizado_em
  before update on cestas
  for each row execute function update_atualizado_em();

-- Atualiza custo_total da cesta ao inserir/atualizar itens
create or replace function recalcular_custo_cesta()
returns trigger language plpgsql as $$
begin
  update cestas
  set custo_total = (
    select coalesce(sum(custo_total_item), 0)
    from cesta_itens
    where cesta_id = coalesce(new.cesta_id, old.cesta_id)
  )
  where id = coalesce(new.cesta_id, old.cesta_id);
  return new;
end;
$$;

create trigger trg_recalc_custo_insert
  after insert or update on cesta_itens
  for each row execute function recalcular_custo_cesta();

create trigger trg_recalc_custo_delete
  after delete on cesta_itens
  for each row execute function recalcular_custo_cesta();

-- ============================================
-- DADOS INICIAIS
-- ============================================

insert into categorias (nome, cor) values
  ('Bebidas', '#3b82f6'),
  ('Paes', '#f59e0b'),
  ('Bolos', '#ec4899'),
  ('Frutas', '#22c55e'),
  ('Biscoitos', '#f97316'),
  ('Chocolates', '#92400e'),
  ('Frios', '#06b6d4'),
  ('Embalagens', '#8b5cf6'),
  ('Decoracao', '#e11d48'),
  ('Flores', '#f43f5e'),
  ('Cartoes', '#6366f1'),
  ('Outros', '#6b7280')
on conflict do nothing;

insert into configuracoes (chave, valor) values
  ('nome_loja', 'Cestas com Afeto'),
  ('telefone', ''),
  ('whatsapp', '5588900000000'),
  ('endereco', ''),
  ('chave_pix', ''),
  ('mensagem_padrao', 'Muito obrigado pela preferencia! Que seja especial.'),
  ('estoque_minimo_padrao', '5'),
  ('dias_alerta_validade', '7'),
  ('percentual_lucro_desejado', '50')
on conflict (chave) do nothing;
