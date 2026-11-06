# Ecclesia — Backend REST API (Laravel 11)

Backend RESTful desenvolvido em Laravel 11 para suporte completo ao frontend do Ecclesia Gestão Eclesiástica.

---

## 🛠️ Especificações Técnicas

- **PHP:** 8.3.15 (requisito `composer.json`: `^8.2`)
- **Laravel Framework:** 11.54.0 (requisito `composer.json`: `^11.0`, lock: `v11.54.0`)
- **Autenticação:** Laravel Sanctum 4.x (tokens Bearer)
- **Banco de Dados:** SQLite (padrão local em `database/database.sqlite`) / MySQL configurável via `.env`
- **Auditoria Automática:** Trait `Auditable` com registro contínuo na tabela `audit_logs`
- **CORS:** Habilitado para integração com frontend Vite (`localhost:5173`, `localhost:8080`, etc.)

---

## 🚀 Como Iniciar

1. Certifique-se de estar na pasta do backend:
   ```bash
   cd backend
   ```

2. Executar migrações e alimentar com dados de demonstração (caso ainda não executado):
   ```bash
   php artisan migrate --seed
   ```

3. Iniciar o servidor de desenvolvimento:
   ```bash
   php artisan serve
   ```
   O backend estará acessível em: `http://localhost:8000`

4. Executar os testes automatizados:
   ```bash
   php artisan test
   ```

---

## 🔐 Credenciais Padrão do Seeder

- **E-mail:** `admin@ecclesia.com`
- **Senha:** `password123`

---

## 📡 Endpoints da API

### Autenticação (`/api/auth`)
- `POST /api/auth/register` — Cadastro de usuário
- `POST /api/auth/login` — Login e geração de token Bearer
- `POST /api/auth/logout` — Revogação de token (requer Bearer token)
- `GET  /api/auth/me` — Dados do usuário logado (requer Bearer token)

### Recursos Principais (CRUD REST completo)
| Recurso | Endpoints | Descrição |
|---|---|---|
| **Membros** | `/api/members` | Cadastro, ficha completa, parentescos e datas |
| **Congregações** | `/api/congregations` | Sede e congregações filiadas |
| **Departamentos** | `/api/departments` | Ministérios, líderes e integrantes |
| **Financeiro** | `/api/transactions` | Receitas e despesas com comprovantes |
| **Dízimos e Ofertas**| `/api/contributions` | Contribuições nominadas ou anônimas |
| **Agenda de Eventos**| `/api/events` | Cultos, conferências, ensaios e reuniões |
| **Agenda Pastoral** | `/api/appointments` | Visitas e atendimentos pastorais |
| **Inventário** | `/api/inventory` | Patrimônio, equipamentos e bens da igreja |
| **Auditoria** | `/api/audit-logs` | Histórico de criações, edições e exclusões |

### Painel, Resumos e Relatórios
- `GET /api/dashboard` — Indicadores consolidados do mês, comparativo histórico de 6 meses, aniversariantes do mês e próximos eventos
- `GET /api/reports/members-by-age` — Distribuição por faixa etária (0–12, 13–17, 18–25, 26–35, 36–45, 46–59, 60–69, 70+) e lista ordenada
- `GET /api/transactions-summary` — Totais de receitas, despesas e saldo em caixa
- `GET /api/inventory-summary` — Total de itens, unidades e avaliação patrimonial
- `GET /api/db-state` — Estado completo do banco em formato espelhado ao frontend para sincronização imediata
