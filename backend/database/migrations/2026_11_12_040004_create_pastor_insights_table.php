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
        Schema::create('pastor_insights', function (Blueprint $table) {
            $table->id();
            $table->string('type', 50)->default('note'); // note, verse, quote, illustration
            $table->string('title')->nullable();
            $table->string('reference')->nullable();
            $table->text('content');
            $table->json('tags')->nullable();
            $table->unsignedBigInteger('sermon_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamps();

            $table->foreign('sermon_id')->references('id')->on('pastor_sermons')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pastor_insights');
    }
};
