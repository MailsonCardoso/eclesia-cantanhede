<?php

use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CongregationController;
use App\Http\Controllers\Api\ContributionController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\PastoralController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\TransactionController;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\Congregation;
use App\Models\Contribution;
use App\Models\Department;
use App\Models\Event;
use App\Models\Inventory;
use App\Models\Member;
use App\Models\PastoralRequest;
use App\Models\PastorInsight;
use App\Models\PastorSeries;
use App\Models\PastorSermon;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Ecclesia Gestão Eclesiástica
|--------------------------------------------------------------------------
*/

// Autenticação
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

// Usuário autenticado
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Painel e Relatórios
Route::get('/dashboard', [DashboardController::class, 'index']);
Route::get('/reports/members-by-age', [ReportController::class, 'membersByAge']);
Route::get('/transactions-summary', [TransactionController::class, 'summary']);
Route::get('/inventory-summary', [InventoryController::class, 'summary']);

// Recursos Principais (CRUD REST)
Route::apiResource('members', MemberController::class);
Route::apiResource('congregations', CongregationController::class);
Route::apiResource('departments', DepartmentController::class);
Route::apiResource('transactions', TransactionController::class);
Route::apiResource('contributions', ContributionController::class);
Route::apiResource('events', EventController::class);
Route::apiResource('appointments', AppointmentController::class);
Route::apiResource('inventory', InventoryController::class);
Route::get('audit-logs', [AuditLogController::class, 'index']);

// Gabinete & Conteúdo Pastoral
Route::prefix('pastoral')->group(function () {
    Route::get('series', [PastoralController::class, 'seriesIndex']);
    Route::post('series', [PastoralController::class, 'seriesStore']);
    Route::put('series/{series}', [PastoralController::class, 'seriesUpdate']);
    Route::delete('series/{series}', [PastoralController::class, 'seriesDestroy']);

    Route::get('sermons', [PastoralController::class, 'sermonsIndex']);
    Route::post('sermons', [PastoralController::class, 'sermonStore']);
    Route::get('sermons/{sermon}', [PastoralController::class, 'sermonShow']);
    Route::put('sermons/{sermon}', [PastoralController::class, 'sermonUpdate']);
    Route::delete('sermons/{sermon}', [PastoralController::class, 'sermonDestroy']);

    Route::get('insights', [PastoralController::class, 'insightsIndex']);
    Route::post('insights', [PastoralController::class, 'insightStore']);
    Route::put('insights/{insight}', [PastoralController::class, 'insightUpdate']);
    Route::delete('insights/{insight}', [PastoralController::class, 'insightDestroy']);

    Route::get('requests', [PastoralController::class, 'requestsIndex']);
    Route::post('requests', [PastoralController::class, 'requestStore']);
    Route::put('requests/{pastoralRequest}', [PastoralController::class, 'requestUpdate']);
    Route::delete('requests/{pastoralRequest}', [PastoralController::class, 'requestDestroy']);
});

// Exportação / Sincronização do estado completo (compatível com a interface DB do frontend)
Route::get('/db-state', function () {
    return response()->json([
        'members' => Member::with(['father', 'mother', 'spouse'])->orderBy('nome')->get(),
        'congregations' => Congregation::orderBy('nome')->get(),
        'departments' => Department::orderBy('nome')->get(),
        'transactions' => Transaction::orderBy('data', 'desc')->get(),
        'contributions' => Contribution::orderBy('data', 'desc')->get(),
        'events' => Event::orderBy('data', 'desc')->get(),
        'appointments' => Appointment::with('member')->orderBy('data', 'desc')->get(),
        'inventory' => Inventory::orderBy('nome')->get(),
        'pastor_series' => PastorSeries::orderBy('id', 'desc')->get(),
        'pastor_sermons' => PastorSermon::with(['seriesRelation', 'insights'])->orderBy('date', 'desc')->get(),
        'pastor_insights' => PastorInsight::orderBy('id', 'desc')->get(),
        'pastoral_requests' => PastoralRequest::with('member')->orderBy('requested_at', 'desc')->get(),
        'audit' => AuditLog::orderBy('created_at', 'desc')->limit(50)->get(),
    ]);
});

// Ações utilitárias para testes: limpar dados mockados ou re-semear dados de demonstração
Route::post('/clear-mock-data', function () {
    \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
    PastoralRequest::truncate();
    PastorInsight::truncate();
    PastorSermon::truncate();
    PastorSeries::truncate();
    Appointment::truncate();
    Contribution::truncate();
    Transaction::truncate();
    Event::truncate();
    Inventory::truncate();
    Department::truncate();
    Member::truncate();
    Congregation::truncate();
    if (\Illuminate\Support\Facades\Schema::hasTable('audit_logs')) {
        AuditLog::truncate();
    }
    \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

    return response()->json([
        'success' => true,
        'message' => 'Todos os dados mockados foram limpos com sucesso.',
    ]);
});

Route::post('/seed-mock-data', function () {
    \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
    return response()->json([
        'success' => true,
        'message' => 'Dados de demonstração carregados com sucesso no banco de dados.',
    ]);
});

