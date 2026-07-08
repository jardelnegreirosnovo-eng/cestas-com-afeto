import { Cesta, Cliente, Venda } from './supabase'

export function gerarLinkWhatsApp(numero: string, mensagem: string): string {
  const numeroLimpo = numero.replace(/\D/g, '')
  const mensagemEncoded = encodeURIComponent(mensagem)
  return `https://wa.me/${numeroLimpo}?text=${mensagemEncoded}`
}

export function gerarMensagemVenda(venda: Venda, cesta: Cesta, cliente?: Cliente): string {
  const nomeLoja = process.env.NEXT_PUBLIC_APP_NAME || 'Cestas com Afeto'
  const dataVenda = new Date(venda.data_venda).toLocaleDateString('pt-BR')
  const formasPgto: Record<string, string> = {
    pix: 'Pix',
    dinheiro: 'Dinheiro',
    credito: 'Cartao de Credito',
    debito: 'Cartao de Debito',
    transferencia: 'Transferencia',
    fiado: 'Fiado',
    outro: 'Outro'
  }
  const formaPgto = formasPgto[venda.forma_pagamento] || venda.forma_pagamento

  let mensagem = `*${nomeLoja}* - Confirmacao de Pedido\n\n`
  mensagem += `Ola${cliente ? `, *${cliente.nome}*` : ''}! 🧺\n\n`
  mensagem += `*Cesta:* ${cesta.nome}\n`
  if (cesta.descricao) mensagem += `*Descricao:* ${cesta.descricao}\n`
  mensagem += `*Valor:* R$ ${venda.valor_venda.toFixed(2).replace('.', ',')}\n`
  mensagem += `*Forma de Pagamento:* ${formaPgto}\n`
  mensagem += `*Data do Pedido:* ${dataVenda}\n`
  if (venda.endereco_entrega) mensagem += `*Endereco de Entrega:* ${venda.endereco_entrega}\n`
  if (venda.mensagem_cartao) mensagem += `\n*Mensagem do Cartao:* ${venda.mensagem_cartao}\n`
  mensagem += `\nMuito obrigado pela preferencia! Com muito afeto. 💕`
  return mensagem
}

export function gerarMensagemEncomenda(params: {
  nomeCliente: string
  nomeCesta: string
  valorTotal: number
  dataEntrega?: string
  horarioEntrega?: string
  endereco?: string
  mensagemPersonalizada?: string
}): string {
  const nomeLoja = process.env.NEXT_PUBLIC_APP_NAME || 'Cestas com Afeto'
  let mensagem = `*${nomeLoja}* - Encomenda Recebida!\n\n`
  mensagem += `Ola, *${params.nomeCliente}*! 🧺\n\n`
  mensagem += `Sua encomenda foi registrada com sucesso!\n\n`
  mensagem += `*Cesta:* ${params.nomeCesta}\n`
  mensagem += `*Valor Total:* R$ ${params.valorTotal.toFixed(2).replace('.', ',')}\n`
  if (params.dataEntrega) {
    const data = new Date(params.dataEntrega).toLocaleDateString('pt-BR')
    mensagem += `*Data de Entrega:* ${data}\n`
  }
  if (params.horarioEntrega) mensagem += `*Horario:* ${params.horarioEntrega}\n`
  if (params.endereco) mensagem += `*Endereco:* ${params.endereco}\n`
  if (params.mensagemPersonalizada) mensagem += `\n*Mensagem para o Cartao:*\n${params.mensagemPersonalizada}\n`
  mensagem += `\nMuito obrigado pela preferencia! Com muito afeto. 💕`
  return mensagem
}

export function abrirWhatsApp(numero: string, mensagem: string): void {
  const link = gerarLinkWhatsApp(numero, mensagem)
  window.open(link, '_blank')
}
