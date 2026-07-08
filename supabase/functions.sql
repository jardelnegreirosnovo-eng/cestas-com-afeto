-- Funcao para decrementar estoque automaticamente ao registrar venda
CREATE OR REPLACE FUNCTION decrementar_estoque(
  p_produto_id UUID,
  p_quantidade INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE produtos
  SET estoque_atual = estoque_atual - p_quantidade,
      updated_at = NOW()
  WHERE id = p_produto_id;

  -- Registrar movimentacao de estoque
  INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, motivo)
  VALUES (p_produto_id, 'saida', p_quantidade, 'Venda registrada');
END;
$$;

-- Funcao para calcular lucro total de um periodo
CREATE OR REPLACE FUNCTION lucro_periodo(
  p_inicio TIMESTAMP,
  p_fim TIMESTAMP
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_lucro NUMERIC;
BEGIN
  SELECT COALESCE(SUM(lucro), 0)
  INTO v_lucro
  FROM vendas
  WHERE created_at BETWEEN p_inicio AND p_fim
    AND status = 'pago';

  RETURN v_lucro;
END;
$$;

-- Conceder permissao para funcoes
GRANT EXECUTE ON FUNCTION decrementar_estoque(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION lucro_periodo(TIMESTAMP, TIMESTAMP) TO authenticated;
