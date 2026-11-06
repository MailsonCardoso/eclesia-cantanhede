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

// Exportação / Sincronização do estado completo (compatível com a interface DB do frontend)
Route::get('/db-state', function () {
    return response()->json([
        'members' => Member::orderBy('nome')->get(),
        'congregations' => Congregation::orderBy('nome')->get(),
        'departments' => Department::orderBy('nome')->get(),
        'transactions' => Transaction::orderBy('data', 'desc')->get(),
        'contributions' => Contribution::orderBy('data', 'desc')->get(),
        'events' => Event::orderBy('data', 'desc')->get(),
        'appointments' => Appointment::orderBy('data', 'desc')->get(),
        'inventory' => Inventory::orderBy('nome')->get(),
        'audit' => AuditLog::orderBy('created_at', 'desc')->limit(50)->get(),
    ]);
});
