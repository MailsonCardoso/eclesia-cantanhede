<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        $payload = [
            'name' => 'Pastor Silva',
            'email' => 'pastor@teste.com',
            'password' => 'secret123',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure(['user', 'token', 'token_type']);

        $this->assertDatabaseHas('users', ['email' => 'pastor@teste.com']);
    }

    public function test_user_can_login_and_access_me(): void
    {
        $user = User::factory()->create([
            'email' => 'login@teste.com',
            'password' => bcrypt('password123'),
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'login@teste.com',
            'password' => 'password123',
        ]);

        $loginResponse->assertStatus(200)
            ->assertJsonStructure(['user', 'token']);

        $token = $loginResponse->json('token');

        $meResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');

        $meResponse->assertStatus(200)
            ->assertJsonPath('email', 'login@teste.com');
    }
}

