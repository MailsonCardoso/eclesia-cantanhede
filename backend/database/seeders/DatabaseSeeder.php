<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\Congregation;
use App\Models\Contribution;
use App\Models\Department;
use App\Models\Event;
use App\Models\Inventory;
use App\Models\Member;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Usuário Administrador padrão
        $admin = User::firstOrCreate(
            ['email' => 'admin@ecclesia.com'],
            [
                'name' => 'Pastor Administrador',
                'password' => Hash::make('password123'),
            ]
        );

        $congsData = [
            [
                'nome' => 'Sede Central',
                'cnpj' => '12.345.678/0001-90',
                'endereco' => 'Av. Principal, 500',
                'telefone' => '(11) 3300-4100',
                'pastor' => 'Pr. João Silva',
                'fundacao' => '1988-03-15',
                'situacao' => 'Ativa',
            ],
            [
                'nome' => 'Congregação Vila Nova',
                'cnpj' => null,
                'endereco' => 'Av. Principal, 620',
                'telefone' => '(11) 3301-4101',
                'pastor' => 'Pr. Marcos Reis',
                'fundacao' => '1993-03-15',
                'situacao' => 'Ativa',
            ],
            [
                'nome' => 'Congregação Jardim Esperança',
                'cnpj' => null,
                'endereco' => 'Av. Principal, 740',
                'telefone' => '(11) 3302-4102',
                'pastor' => 'Pr. André Luz',
                'fundacao' => '1998-03-15',
                'situacao' => 'Ativa',
            ],
        ];

        foreach ($congsData as $c) {
            Congregation::create($c);
        }

        $congs = ['Sede Central', 'Congregação Vila Nova', 'Congregação Jardim Esperança'];

        $names = [
            'Ana Beatriz Souza', 'Carlos Eduardo Lima', 'Débora Ferreira', 'Elias Martins', 'Fernanda Rocha',
            'Gabriel Almeida', 'Helena Costa', 'Isaque Pereira', 'Júlia Ribeiro', 'Lucas Barbosa',
            'Marta Oliveira', 'Natanael Gomes', 'Priscila Santos', 'Rafael Carvalho', 'Sara Mendes',
            'Tiago Nunes', 'Raquel Dias', 'Samuel Teixeira',
        ];

        // 2. Departamentos
        $deps = [
            'Louvor', 'Jovens', 'Crianças', 'Adolescentes', 'Mulheres',
            'Homens', 'Intercessão', 'Evangelismo', 'Ação Social', 'Escola Bíblica Dominical',
        ];

        foreach ($deps as $i => $n) {
            Department::create([
                'nome' => $n,
                'lider' => $names[$i % count($names)],
                'integrantes' => 6 + (($i * 7) % 20),
                'descricao' => "Ministério de {$n}",
                'situacao' => 'Ativo',
            ]);
        }

        // 3. Membros
        $now = Carbon::now();
        foreach ($names as $i => $n) {
            $birth = ($i % 4 === 0)
                ? Carbon::create(1980 + ($i % 10), $now->month, 3 + $i)->format('Y-m-d')
                : '19' . (70 + $i) . '-0' . (($i % 9) + 1) . '-1' . ($i % 9);

            Member::create([
                'nome' => $n,
                'cpf' => sprintf('%03d.%03d.%03d-%02d', 100 + $i, 200 + $i, 300 + $i, 10 + $i),
                'nascimento' => $birth,
                'sexo' => $i % 2 ? 'Masculino' : 'Feminino',
                'estado_civil' => ['Casado(a)', 'Solteiro(a)', 'Viúvo(a)'][$i % 3],
                'telefone' => sprintf('(11) 9%04d-%04d', 8000 + $i * 37, 1000 + $i * 13),
                'email' => strtolower(explode(' ', $n)[0]) . '@email.com',
                'endereco' => 'Rua das Oliveiras, ' . (100 + $i * 7),
                'batismo' => '20' . (10 + ($i % 14)) . '-04-12',
                'recebimento' => $now->copy()->subDays($i * 40)->format('Y-m-d'),
                'situacao' => $i % 7 === 6 ? 'Inativo' : ($i % 9 === 8 ? 'Transferido' : 'Ativo'),
                'tipo' => $i % 5 === 4 ? 'Congregado' : 'Membro',
                'congregacao' => $congs[$i % 3],
                'departamento' => ['Louvor', 'Jovens', 'Mulheres', 'Homens', 'Intercessão'][$i % 5],
                'cargo' => ['Membro', 'Diácono', 'Presbítero', 'Obreiro'][$i % 4],
                'conjuge' => $i % 3 === 0 ? $names[($i + 1) % count($names)] : null,
                'pai' => $i % 2 === 0 ? $names[($i + 5) % count($names)] : null,
                'mae' => $i % 2 === 0 ? $names[($i + 6) % count($names)] : null,
                'filhos' => $i % 4 === 1 ? $names[($i + 9) % count($names)] : null,
                'observacoes' => null,
            ]);
        }

        // 4. Movimentações Financeiras
        $templates = [
            ['Receita', 'Dízimos', 9800],
            ['Receita', 'Ofertas', 3200],
            ['Receita', 'Campanhas', 1500],
            ['Despesa', 'Energia', 890],
            ['Despesa', 'Aluguel', 3500],
            ['Despesa', 'Ação social', 1200],
            ['Despesa', 'Manutenção', 700],
        ];

        for ($m = 0; $m < 6; $m++) {
            foreach ($templates as $j => [$tipo, $cat, $v]) {
                $valor = round($v * (0.85 + (($m * 3 + $j) % 7) / 20), 2);
                Transaction::create([
                    'tipo' => $tipo,
                    'categoria' => $cat,
                    'descricao' => "{$cat} do mês",
                    'valor' => $valor,
                    'data' => $now->copy()->subDays($m * 30 + $j)->format('Y-m-d'),
                    'pagamento' => ['PIX', 'Dinheiro', 'Transferência'][$j % 3],
                    'conta' => 'Conta principal',
                    'congregacao' => $congs[$j % 3],
                ]);
            }
        }

        // 5. Contribuições
        for ($i = 0; $i < 14; $i++) {
            Contribution::create([
                'membro' => $i % 5 === 0 ? 'Anônimo' : $names[$i],
                'tipo' => $i % 3 ? 'Dízimo' : 'Oferta',
                'valor' => 50 + (($i * 73) % 600),
                'data' => $now->copy()->subDays($i * 2)->format('Y-m-d'),
                'pagamento' => ['PIX', 'Dinheiro', 'Cartão'][$i % 3],
                'congregacao' => $congs[$i % 3],
            ]);
        }

        // 6. Agenda de Eventos
        $eventsData = [
            ['titulo' => 'Culto de Celebração', 'offset' => 3, 'hora' => '19:00', 'tipo' => 'Culto', 'local' => 'Sede Central', 'responsavel' => 'Pr. João Silva'],
            ['titulo' => 'Conferência de Jovens', 'offset' => 10, 'hora' => '15:00', 'tipo' => 'Conferência', 'local' => 'Sede Central', 'responsavel' => 'Gabriel Almeida'],
            ['titulo' => 'Ação Social no Bairro', 'offset' => 17, 'hora' => '09:00', 'tipo' => 'Social', 'local' => 'Vila Nova', 'responsavel' => 'Marta Oliveira'],
            ['titulo' => 'Santa Ceia', 'offset' => 24, 'hora' => '19:30', 'tipo' => 'Culto', 'local' => 'Todas as congregações', 'responsavel' => 'Pr. João Silva'],
            ['titulo' => 'Ensaio do Louvor', 'offset' => 1, 'hora' => '20:00', 'tipo' => 'Ensaio', 'local' => 'Sede Central', 'responsavel' => 'Lucas Barbosa'],
            ['titulo' => 'Escola Bíblica Dominical', 'offset' => 5, 'hora' => '09:00', 'tipo' => 'EBD', 'local' => 'Todas as congregações', 'responsavel' => 'Débora Ferreira'],
            ['titulo' => 'Vigília de Oração', 'offset' => 12, 'hora' => '22:00', 'tipo' => 'Vigília', 'local' => 'Sede Central', 'responsavel' => 'Pr. Marcos Reis'],
            ['titulo' => 'Evangelismo na Praça', 'offset' => 19, 'hora' => '16:00', 'tipo' => 'Evangelismo', 'local' => 'Praça Central', 'responsavel' => 'Tiago Nunes'],
            ['titulo' => 'Reunião de Obreiros', 'offset' => 8, 'hora' => '19:00', 'tipo' => 'Reunião', 'local' => 'Sede Central', 'responsavel' => 'Pr. André Luz'],
        ];

        foreach ($eventsData as $ev) {
            Event::create([
                'titulo' => $ev['titulo'],
                'data' => $now->copy()->addDays($ev['offset'])->format('Y-m-d'),
                'hora' => $ev['hora'],
                'tipo' => $ev['tipo'],
                'local' => $ev['local'],
                'responsavel' => $ev['responsavel'],
                'descricao' => 'Programação geral da igreja.',
            ]);
        }

        // 7. Agenda Pastoral
        $appointmentsData = [
            ['membro' => $names[2], 'offset' => 1, 'hora' => '14:00', 'tipo' => 'Aconselhamento', 'motivo' => 'Aconselhamento familiar', 'status' => 'Agendado'],
            ['membro' => $names[6], 'offset' => 2, 'hora' => '10:00', 'tipo' => 'Visita', 'motivo' => 'Visita pós-operatória', 'status' => 'Agendado'],
            ['membro' => $names[9], 'offset' => 4, 'hora' => '16:30', 'tipo' => 'Aconselhamento', 'motivo' => 'Orientação vocacional', 'status' => 'Agendado'],
            ['membro' => $names[12], 'offset' => -1, 'hora' => '19:00', 'tipo' => 'Visita', 'motivo' => 'Visita a novo convertido', 'status' => 'Realizado'],
            ['membro' => $names[15], 'offset' => 6, 'hora' => '09:30', 'tipo' => 'Aconselhamento', 'motivo' => 'Aconselhamento pré-casamento', 'status' => 'Agendado'],
            ['membro' => $names[4], 'offset' => -3, 'hora' => '15:00', 'tipo' => 'Visita', 'motivo' => 'Visita de aniversário', 'status' => 'Cancelado'],
        ];

        foreach ($appointmentsData as $ap) {
            Appointment::create([
                'membro' => $ap['membro'],
                'data' => $now->copy()->addDays($ap['offset'])->format('Y-m-d'),
                'hora' => $ap['hora'],
                'tipo' => $ap['tipo'],
                'motivo' => $ap['motivo'],
                'status' => $ap['status'],
            ]);
        }

        // 8. Inventário
        $inventoryData = [
            ['nome' => 'Cadeiras plásticas', 'categoria' => 'Mobiliário', 'quantidade' => 220, 'estado' => 'Bom', 'local' => 'Sede Central', 'aquisicao' => '2021-05-10', 'valor' => 85],
            ['nome' => 'Mesa de som 16 canais', 'categoria' => 'Áudio', 'quantidade' => 1, 'estado' => 'Bom', 'local' => 'Sede Central', 'aquisicao' => '2019-11-02', 'valor' => 4200],
            ['nome' => 'Microfones sem fio', 'categoria' => 'Áudio', 'quantidade' => 6, 'estado' => 'Regular', 'local' => 'Sede Central', 'aquisicao' => '2022-03-18', 'valor' => 950],
            ['nome' => 'Projetor multimídia', 'categoria' => 'Audiovisual', 'quantidade' => 2, 'estado' => 'Bom', 'local' => 'Sede Central', 'aquisicao' => '2023-01-25', 'valor' => 2800],
            ['nome' => 'Instrumentos musicais (bateria)', 'categoria' => 'Instrumentos', 'quantidade' => 1, 'estado' => 'Bom', 'local' => 'Sede Central', 'aquisicao' => '2020-08-14', 'valor' => 5600],
            ['nome' => 'Bíblias para EBD', 'categoria' => 'Material didático', 'quantidade' => 45, 'estado' => 'Regular', 'local' => 'Congregação Vila Nova', 'aquisicao' => '2022-07-30', 'valor' => 60],
            ['nome' => 'Ar-condicionado 24.000 BTU', 'categoria' => 'Climatização', 'quantidade' => 4, 'estado' => 'Bom', 'local' => 'Sede Central', 'aquisicao' => '2021-12-05', 'valor' => 3900],
            ['nome' => 'Computador da secretaria', 'categoria' => 'Informática', 'quantidade' => 2, 'estado' => 'Regular', 'local' => 'Sede Central', 'aquisicao' => '2020-02-20', 'valor' => 3200],
            ['nome' => 'Cadeiras de madeira', 'categoria' => 'Mobiliário', 'quantidade' => 60, 'estado' => 'Regular', 'local' => 'Congregação Jardim Esperança', 'aquisicao' => '2018-06-11', 'valor' => 120],
            ['nome' => 'Caixas de som ativas', 'categoria' => 'Áudio', 'quantidade' => 4, 'estado' => 'Bom', 'local' => 'Congregação Vila Nova', 'aquisicao' => '2023-09-08', 'valor' => 1800],
        ];

        foreach ($inventoryData as $inv) {
            Inventory::create($inv);
        }
    }
}
