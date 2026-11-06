<?php

namespace Tests\Feature;

use App\Models\Member;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MembersApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_members(): void
    {
        Member::create([
            'nome' => 'Membro Teste',
            'telefone' => '(11) 99999-9999',
            'tipo' => 'Membro',
            'situacao' => 'Ativo',
        ]);

        $response = $this->getJson('/api/members');

        $response->assertStatus(200)
            ->assertJsonFragment(['nome' => 'Membro Teste']);
    }

    public function test_can_create_member_with_family_fields(): void
    {
        $payload = [
            'nome' => 'João Ferreira',
            'cpf' => '123.456.789-00',
            'nascimento' => '1990-05-15',
            'sexo' => 'Masculino',
            'estadoCivil' => 'Casado(a)',
            'telefone' => '(11) 98888-7777',
            'email' => 'joao@teste.com',
            'tipo' => 'Membro',
            'situacao' => 'Ativo',
            'congregacao' => 'Sede Central',
            'conjuge' => 'Maria Ferreira',
            'filhos' => 'Pedro, Lucas',
        ];

        $response = $this->postJson('/api/members', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('nome', 'João Ferreira')
            ->assertJsonPath('estadoCivil', 'Casado(a)');

        $this->assertDatabaseHas('members', [
            'nome' => 'João Ferreira',
            'estado_civil' => 'Casado(a)',
        ]);
    }

    public function test_can_update_member(): void
    {
        $member = Member::create([
            'nome' => 'Nome Antigo',
            'tipo' => 'Membro',
            'situacao' => 'Ativo',
        ]);

        $response = $this->putJson("/api/members/{$member->id}", [
            'nome' => 'Nome Atualizado',
            'situacao' => 'Transferido',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('nome', 'Nome Atualizado')
            ->assertJsonPath('situacao', 'Transferido');
    }

    public function test_can_delete_member(): void
    {
        $member = Member::create([
            'nome' => 'Para Deletar',
            'tipo' => 'Membro',
            'situacao' => 'Ativo',
        ]);

        $response = $this->deleteJson("/api/members/{$member->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('members', ['id' => $member->id]);
    }
}

