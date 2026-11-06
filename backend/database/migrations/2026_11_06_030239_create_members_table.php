<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->string('cpf')->nullable();
            $table->date('nascimento')->nullable();
            $table->string('sexo')->nullable();
            $table->string('estado_civil')->nullable();
            $table->string('telefone')->nullable();
            $table->string('email')->nullable();
            $table->string('endereco')->nullable();
            $table->date('conversao')->nullable();
            $table->date('batismo')->nullable();
            $table->date('recebimento')->nullable();
            $table->string('tipo')->default('Membro');
            $table->string('situacao')->default('Ativo');
            $table->string('congregacao')->nullable();
            $table->string('departamento')->nullable();
            $table->string('cargo')->nullable();
            $table->string('conjuge')->nullable();
            $table->string('pai')->nullable();
            $table->string('mae')->nullable();
            $table->string('filhos')->nullable();
            $table->text('observacoes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
