# Layout executivo — PCD Workforce & Inclusion

Referência visual: protótipo azul corporativo (leitura multinacional / gerencial).  
Canvas sugerido: **1920 × 1080** (1 página principal). Tema: azul `#0B3A5B` / `#1B6CA8` / `#E8F2FA` / branco.

## Hierarquia (primeiro olhar → detalhe)

```
┌─ [LOGO 160×48] ── Segmentadores principais ────────── [botão Filtros+] ─┐
├─ KPI │ KPI │ KPI │ KPI │ KPI │ Gauge Meta/% │ (cards)                    │
├─ Evolução % PCD (área) ─── HC x PCD x % por Oficina ─── Tipo deficiência │
├─ Meta x Realizado ──────── Adm x Deslig por Oficina ── Blue vs White     │
└─ Promoções / Movimentações ─────────────── Tempo de empresa / detalhe    ┘
```

## Espaço do logo

- Retângulo vazio **canto superior esquerdo** (~160×48 px), sem título por cima.
- Cliente insere o logo depois (Inserir > Imagem) sem refazer o layout.

## Filtros

**Visíveis (barra superior):** Ano | Mês | Planta | Área | Turno  
(Diretoria removida do topo — o recorte oficial é por Área)  

**Painel / botão “Filtros” (bookmark + selection pane):**  
Gerência, Classificação, Tipo de Deficiência, PCD, Status, Liderança  

**Áreas oficiais (9):** Montagem · Qualidade · Pintura · Logística · Funilaria · Supply Chain · Prensa · General Service · Staff e Outras  

Usar **Bookmarks** + botão para abrir/fechar o painel lateral (padrão executivo).

## Mapa de visuais → medidas

| Zona | Visual | Campos / medidas |
|------|--------|------------------|
| Card 1 | Card | `HC Total` |
| Card 2 | Card | `HC PCD` |
| Card 3 | Card | `Pct PCD` (formato %) |
| Card 4 | Card | `Meta Pct PCD` |
| Card 5 | Card | `GAP Meta Realizado` (condicional: vermelho se < 0) |
| Gauge / KPI | Radial / card | `Pct PCD` vs `Meta Pct PCD` |
| Por turno | Clustered bar | Turno (1º / 2º / 3º / Administrativo) + `HC Total`, `HC PCD` |
| Por oficina | Matrix / table | Oficina + `HC Total`, `HC PCD`, `Pct PCD` |
| GAP oficina | Bar | Oficina + `GAP Meta Realizado` (no snapshot) ou `GAP Historico` |
| Adm x Deslig | Clustered bar | Oficina + `Admissoes PCD`, `Desligamentos PCD` |
| Tipo deficiência | Donut | `Tipo de Deficiência` + contagem PCD ativos |
| Blue x White | Donut ou 100% stacked | `Pct PCD Blue Collar`, `Pct PCD White Collar` |
| Promoções / mov. | Cards ou bar | `Promocoes PCD`, `Movimentacoes Internas PCD` |
| Tempo empresa | Card / histogram | `Tempo Medio Empresa PCD Anos` |
| Liderança | Card | `Pct PCD em Lideranca` |

## Formatação executiva

- Fundo página: `#F5F8FB`
- Cards: branco, cantos 8px, sombra suave
- Sem poluição: **máx. 1 título curto por visual**
- Tipografia: Segoe UI / DIN (tema JSON)
- Paleta: **azul** (padrão). **Verde** só meta/resultado positivo. **Vermelho** só GAP negativo ou crítico.

## Tema JSON (cores)

Arquivo: `powerbi/theme/PCD_Executive_Blue.json`

## Página 2 (opcional / evolução)

Detalhe por oficina (drill) + tabela de movimentações PCD — só se o prazo permitir; o brief cabe em **1 página executiva**.
