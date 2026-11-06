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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->date('data');
            $table->string('tipo'); // Receita ou Despesa
            $table->string('categoria');
            $table->string('descricao')->nullable();
            $table->decimal('valor', 12, 2);
            $table->string('pagamento')->nullable();
            $table->string('conta')->nullable();
            $table->string('congregacao')->nullable();
            $table->string('comprovante')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
