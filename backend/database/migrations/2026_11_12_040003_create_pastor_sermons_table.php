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
        Schema::create('pastor_sermons', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('series')->default('Avulso');
            $table->unsignedBigInteger('series_id')->nullable();
            $table->string('verse')->nullable();
            $table->date('date');
            $table->string('status', 50)->default('Planejado');
            $table->string('color', 50)->default('bg-amber-400');
            $table->json('content')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamps();

            $table->index('series');
            $table->index('date');
            $table->foreign('series_id')->references('id')->on('pastor_series')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pastor_sermons');
    }
};

