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
        Schema::table('members', function (Blueprint $table) {
            $table->unsignedBigInteger('cell_id')->nullable()->after('departamento');
            $table->unsignedBigInteger('father_id')->nullable()->after('cell_id');
            $table->unsignedBigInteger('mother_id')->nullable()->after('father_id');
            $table->unsignedBigInteger('spouse_id')->nullable()->after('mother_id');
            
            $table->string('father_name')->nullable()->after('spouse_id');
            $table->string('mother_name')->nullable()->after('father_name');
            $table->string('spouse_name')->nullable()->after('mother_name');

            $table->string('cep', 15)->nullable()->after('endereco');
            $table->string('logradouro')->nullable()->after('cep');
            $table->string('bairro', 100)->nullable()->after('logradouro');
            $table->string('cidade', 100)->nullable()->after('bairro');
            $table->string('uf', 5)->nullable()->after('cidade');

            $table->string('category', 50)->default('membro')->after('uf');
            $table->string('status', 50)->default('ativo')->after('category');
            $table->string('role', 100)->nullable()->after('status');

            $table->foreign('father_id')->references('id')->on('members')->onDelete('set null');
            $table->foreign('mother_id')->references('id')->on('members')->onDelete('set null');
            $table->foreign('spouse_id')->references('id')->on('members')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropForeign(['father_id']);
            $table->dropForeign(['mother_id']);
            $table->dropForeign(['spouse_id']);
            $table->dropColumn([
                'cell_id', 'father_id', 'mother_id', 'spouse_id',
                'father_name', 'mother_name', 'spouse_name',
                'cep', 'logradouro', 'bairro', 'cidade', 'uf',
                'category', 'status', 'role'
            ]);
        });
    }
};

