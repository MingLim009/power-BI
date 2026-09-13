# Guia rápido — trocar base fictícia → real

## Pré-requisitos

A base real deve ter **as mesmas 4 abas** e **os mesmos nomes de colunas** (tipos compatíveis):

1. `COLABORADORES`
2. `MOVIMENTAÇÕES`
3. `HISTÓRICO MENSAL`
4. `METAS`

Calendário continua só no Power BI.

## Passos (5 minutos)

1. Feche o Excel fictício se estiver aberto.
2. No Power BI Desktop: **Transformar dados**.
3. Abra o parâmetro **`pCaminhoExcel`** (ou a fonte da consulta) e aponte para o Excel real.
4. **Atualizar visualização** em cada consulta → Confirmar tipos (datas, %).
5. **Fechar e aplicar**.
6. **Atualizar** o relatório.

## Checklist de validação pós-troca

- [ ] Contagem de linhas de `COLABORADORES` confere com o Excel real
- [ ] `HC Total` e `HC PCD` batem com um pivô manual (Status=Ativo, PCD=Sim)
- [ ] `Pct PCD` = HC PCD / HC Total
- [ ] `Meta Pct PCD` lê a aba METAS
- [ ] `GAP Meta Realizado` = % − meta
- [ ] Admissões / desligamentos PCD no período batem com MOVIMENTAÇÕES
- [ ] Relacionamentos ativos (sem “linhas em branco” inesperadas demais)
- [ ] Slicers de Planta / Oficina filtram cards e gráficos
- [ ] Sem dados pessoais reais no arquivo de desenvolvimento antigo (arquive/delete a base fictícia se necessário)

## O que NÃO fazer

- Não renomear colunas no Excel real sem atualizar o Power Query
- Não calcular `% PCD` ou `GAP` no Excel — isso é DAX
- Não sobrescrever medidas ao “recriar” visuais do zero

## Credenciais / LGPD

Arquivos sensíveis e acesso a sistemas ficam **somente com o cliente**.  
Este pacote de desenvolvimento usa apenas dados sintéticos.
