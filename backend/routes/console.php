<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Artisan::command('app:clear-mock', function () {
    $this->info('Limpando todas as tabelas mockadas do banco de dados MySQL...');
    \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
    \App\Models\PastoralRequest::truncate();
    \App\Models\PastorInsight::truncate();
    \App\Models\PastorSermon::truncate();
    \App\Models\PastorSeries::truncate();
    \App\Models\Appointment::truncate();
    \App\Models\Contribution::truncate();
    \App\Models\Transaction::truncate();
    \App\Models\Event::truncate();
    \App\Models\Inventory::truncate();
    \App\Models\Department::truncate();
    \App\Models\Member::truncate();
    \App\Models\Congregation::truncate();
    if (\Illuminate\Support\Facades\Schema::hasTable('audit_logs')) {
        \App\Models\AuditLog::truncate();
    }
    \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();
    $this->info('Sucesso: todas as tabelas mockadas foram limpas!');
})->purpose('Limpa todos os dados mockados do banco de dados MySQL mantendo os usuários');

