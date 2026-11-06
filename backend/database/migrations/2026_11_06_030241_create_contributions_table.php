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
        Schema::create('contributions', function (Blueprint $table) {
            $table->id();
            $table->string('membro')->default('Anônimo');
            $table->string('tipo')->default('Dízimo');
            $table->decimal('valor', 12, 2);
            $table->date('data');
            $table->string('pagamento')->nullable();
            $table->string('congregacao')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contributions');
    }
};
