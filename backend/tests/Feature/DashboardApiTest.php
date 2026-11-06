<?php

namespace Tests\Feature;

use App\Models\Member;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_endpoint_returns_expected_structure(): void
    {
        Member::create([
            'nome' => 'Ana Clara',
            'tipo' => 'Membro',
            'situacao' => 'Ativo',
            'recebimento' => now()->toDateString(),
            'nascimento' => '1995-11-10',
        ]);

        $response = $this->getJson('/api/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'total_cadastrados',
                'membros_ativos',
                'novos_no_mes',
                'congregados',
                'dizimos_no_mes',
                'ofertas_no_mes',
                'despesas_no_mes',
                'saldo_no_mes',
                'saldo_total',
                'series',
                'birthdays',
                'upcoming_events',
                'latest_members',
            ]);
    }

    public function test_reports_members_by_age(): void
    {
        Member::create([
            'nome' => 'Jovem',
            'nascimento' => now()->subYears(20)->format('Y-m-d'),
            'tipo' => 'Membro',
            'situacao' => 'Ativo',
        ]);

        $response = $this->getJson('/api/reports/members-by-age');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'chart',
                'list',
            ]);
    }
}

