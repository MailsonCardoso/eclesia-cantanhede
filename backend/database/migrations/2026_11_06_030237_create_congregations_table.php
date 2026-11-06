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
        Schema::create('congregations', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->string('cnpj')->nullable();
            $table->string('endereco')->nullable();
            $table->string('telefone')->nullable();
            $table->string('pastor')->nullable();
            $table->date('fundacao')->nullable();
            $table->string('situacao')->default('Ativa');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('congregations');
    }
};
