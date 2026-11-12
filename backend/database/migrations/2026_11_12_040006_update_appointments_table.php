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
        Schema::table('appointments', function (Blueprint $table) {
            $table->unsignedBigInteger('member_id')->nullable()->after('membro');
            $table->string('person')->nullable()->after('member_id');
            $table->string('location')->nullable()->after('hora');
            $table->time('start_time')->nullable()->after('location');
            $table->time('end_time')->nullable()->after('start_time');

            $table->foreign('member_id')->references('id')->on('members')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['member_id']);
            $table->dropColumn(['member_id', 'person', 'location', 'start_time', 'end_time']);
        });
    }
};
