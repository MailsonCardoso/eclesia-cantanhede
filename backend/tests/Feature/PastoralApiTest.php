<?php

namespace Tests\Feature;

use App\Models\Member;
use App\Models\PastorInsight;
use App\Models\PastorSeries;
use App\Models\PastorSermon;
use App\Models\PastoralRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PastoralApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_and_list_series(): void
    {
        $res = $this->postJson('/api/pastoral/series', [
            'title' => 'Estudos em Romanos',
            'description' => 'Série expositiva de Romanos 1 a 8',
            'total' => 8,
            'completed' => 2,
            'color' => 'bg-indigo-500',
        ]);

        $res->assertStatus(201)
            ->assertJsonPath('title', 'Estudos em Romanos')
            ->assertJsonPath('progress', 25);

        $list = $this->getJson('/api/pastoral/series');
        $list->assertStatus(200)
            ->assertJsonFragment(['title' => 'Estudos em Romanos']);
    }

    public function test_can_create_and_show_sermon_with_json_content(): void
    {
        $sermon = PastorSermon::create([
            'title' => 'A Graça que Transforma',
            'series' => 'Romanos',
            'verse' => 'Rm 5:1-2',
            'date' => now()->toDateString(),
            'status' => 'Planejado',
            'color' => 'bg-amber-400',
            'content' => [
                'intro' => 'Contexto histórico e gancho...',
                'topics' => ['1. Justificação pela Fé', '2. Paz com Deus', '3. Acesso à Graça'],
                'conclusion' => 'Oração final e apelo.',
            ],
        ]);

        $res = $this->getJson("/api/pastoral/sermons/{$sermon->id}");
        $res->assertStatus(200)
            ->assertJsonPath('title', 'A Graça que Transforma')
            ->assertJsonPath('content.topics.1', '2. Paz com Deus');
    }

    public function test_can_create_insight_with_tags(): void
    {
        $res = $this->postJson('/api/pastoral/insights', [
            'type' => 'verse',
            'title' => 'Fundamento da Esperança',
            'reference' => 'Hb 11:1',
            'content' => 'Ora, a fé é a certeza das coisas que se esperam...',
            'tags' => ['fé', 'esperança', 'certeza'],
        ]);

        $res->assertStatus(201)
            ->assertJsonPath('reference', 'Hb 11:1')
            ->assertJsonPath('tags.0', 'fé');
    }

    public function test_can_create_and_list_pastoral_requests(): void
    {
        $res = $this->postJson('/api/pastoral/requests', [
            'person' => 'Irmão João',
            'type' => 'Gabinete',
            'reason' => 'Orientação familiar e oração',
            'status' => 'Pendente',
        ]);

        $res->assertStatus(201)
            ->assertJsonPath('person', 'Irmão João')
            ->assertJsonPath('status', 'Pendente');
    }

    public function test_members_eager_loads_family_relations(): void
    {
        $pai = Member::create([
            'nome' => 'Pai Teste '.rand(100, 999),
            'nascimento' => '1970-01-01',
            'sexo' => 'Masculino',
            'estado_civil' => 'Casado',
        ]);

        $filho = Member::create([
            'nome' => 'Filho Teste '.rand(100, 999),
            'nascimento' => '2015-05-10',
            'sexo' => 'Masculino',
            'father_id' => $pai->id,
            'father_name' => $pai->nome,
        ]);

        $res = $this->getJson("/api/members/{$filho->id}");
        $res->assertStatus(200)
            ->assertJsonPath('father.id', $pai->id);
    }
}
