<?php

namespace Tests\Feature;

use App\Models\Contribution;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_and_list_transactions(): void
    {
        $payload = [
            'data' => '2026-11-01',
            'tipo' => 'Receita',
            'categoria' => 'Dízimos',
            'descricao' => 'Dízimo culto de domingo',
            'valor' => 1500.50,
            'pagamento' => 'PIX',
            'conta' => 'Conta principal',
            'congregacao' => 'Sede Central',
        ];

        $response = $this->postJson('/api/transactions', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('categoria', 'Dízimos')
            ->assertJsonPath('valor', 1500.5);

        $this->getJson('/api/transactions')
            ->assertStatus(200)
            ->assertJsonFragment(['descricao' => 'Dízimo culto de domingo']);
    }

    public function test_can_create_contribution(): void
    {
        $payload = [
            'membro' => 'Carlos Lima',
            'tipo' => 'Dízimo',
            'valor' => 350.00,
            'data' => '2026-11-02',
            'pagamento' => 'Dinheiro',
            'congregacao' => 'Sede Central',
        ];

        $response = $this->postJson('/api/contributions', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('membro', 'Carlos Lima')
            ->assertJsonPath('valor', 350);
    }

    public function test_finance_summary_calculation(): void
    {
        Transaction::create([
            'data' => '2026-11-01',
            'tipo' => 'Receita',
            'categoria' => 'Ofertas',
            'valor' => 1000,
        ]);

        Transaction::create([
            'data' => '2026-11-02',
            'tipo' => 'Despesa',
            'categoria' => 'Energia',
            'valor' => 400,
        ]);

        $response = $this->getJson('/api/transactions-summary');

        $response->assertStatus(200)
            ->assertJson([
                'receitas' => 1000,
                'despesas' => 400,
                'saldo' => 600,
            ]);
    }
}

