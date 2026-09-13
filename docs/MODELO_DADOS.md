# Modelo de dados — PCD Workforce & Inclusion

## Visão (estrela simples)

```
                    ┌─────────────────┐
                    │  DimCalendario  │
                    │  (DAX / PBI)    │
                    └────────┬────────┘
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
 ┌──────────────────┐ ┌────────────┐ ┌──────────────────┐
 │ HISTÓRICO MENSAL │ │   METAS    │ │  MOVIMENTAÇÕES   │
 │ (fato evolução)  │ │ (fato meta)│ │  (fato eventos)  │
 └────────┬─────────┘ └─────┬──────┘ └────────┬─────────┘
          │                 │                 │
          └────────────┬────┴─────────────────┘
                       │  (Planta / Oficina — sync via slicers
                       │   ou relacionamentos bidirecionais leves)
                       ▼
              ┌─────────────────┐
              │  COLABORADORES  │
              │ (snapshot HC)   │
              └─────────────────┘
```

## Relacionamentos a criar no Model view

| De | Para | Cardinalidade | Filtro cruzado |
|----|------|---------------|----------------|
| `DimCalendario[Date]` | `MOVIMENTAÇÕES[Data Movimento]` | 1:* | Single |
| `DimCalendario[Date]` | `HISTÓRICO MENSAL[Data Ref]` | 1:* | Single |
| `DimCalendario[Date]` | `METAS[Data Ref]` | 1:* | Single |
| `COLABORADORES[Matrícula]` | `MOVIMENTAÇÕES[Matrícula]` | 1:* | Single |

### Observações importantes

1. **HC corrente** vem de `COLABORADORES` (Status = Ativo) — não some o histórico.
2. **Evolução % PCD / Meta x Realizado no tempo** usam `HISTÓRICO MENSAL` + `METAS` + `DimCalendario`.
3. **Filtros org** (Planta, Diretoria, Gerência, Área, Oficina, Turno, Classificação, Tipo de Deficiência, PCD, Status, Liderança): campos de `COLABORADORES` nos slicers principais.
4. Para filtrar histórico/metas pela mesma **Planta/Oficina**, use slicers sincronizados:
   - Opção simples: criar slicers de Planta/Oficina a partir de `COLABORADORES` e, no painel Sync slicers, sincronizar com páginas; **ou**
   - Opção robusta: criar `DimPlanta` / `DimOficina` (tabelas distinct) e relacionar às 3 tabelas fato + colaboradores.
5. **DimCalendario** é criada só no Power BI (pedido do cliente).

## DimOficina (opcional, recomendado)

Tabela DAX ou PQ:

```dax
DimOficina =
DISTINCT (
    UNION (
        DISTINCT ( COLABORADORES[Oficina] ),
        DISTINCT ( 'HISTÓRICO MENSAL'[Oficina] ),
        DISTINCT ( METAS[Oficina] )
    )
)
```

Relacionar `DimOficina[Oficina]` 1:* com COLABORADORES, HISTÓRICO MENSAL, METAS, MOVIMENTAÇÕES.

Idem para `DimPlanta` se quiser slicers únicos.

## Ocultar no relatório

- Chaves técnicas se criar dims compostas
- Colunas de fato não usadas em visuais (manter no modelo)
- Preferir medidas da tabela `Medidas` nos cards
