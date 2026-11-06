<?php

namespace App\Http\Controllers\Api;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 50);

        $logs = AuditLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json($logs);
    }
}

