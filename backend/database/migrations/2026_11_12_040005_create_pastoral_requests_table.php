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
        Schema::create('pastoral_requests', function (Blueprint $table) {
            $table->id();
            $table->string('person');
            $table->unsignedBigInteger('member_id')->nullable();
            $table->string('type', 50)->default('Gabinete'); // Gabinete, Visita
            $table->text('reason');
            $table->text('notes')->nullable();
            $table->dateTime('requested_at')->nullable();
            $table->string('status', 50)->default('Pendente'); // Pendente, Agendado, Cancelado
            $table->timestamps();

            $table->foreign('member_id')->references('id')->on('members')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pastoral_requests');
    }
};

