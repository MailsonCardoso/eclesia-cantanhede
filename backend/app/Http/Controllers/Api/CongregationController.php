<?php

namespace App\Http\Controllers\Api;

use App\Models\Congregation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CongregationController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Congregation::query();

        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('nome', 'like', "%{$q}%")
                    ->orWhere('pastor', 'like', "%{$q}%")
                    ->orWhere('endereco', 'like', "%{$q}%");
            });
        }

        if ($request->filled('situacao') && $request->query('situacao') !== '__all') {
            $query->where('situacao', $request->query('situacao'));
        }

        $items = $query->orderBy('nome')->get();

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'cnpj' => ['nullable', 'string', 'max:255'],
            'endereco' => ['nullable', 'string', 'max:255'],
            'telefone' => ['nullable', 'string', 'max:50'],
            'pastor' => ['nullable', 'string', 'max:255'],
            'fundacao' => ['nullable', 'date'],
            'situacao' => ['nullable', 'string', 'max:50'],
        ]);

        $congregation = Congregation::create($validated);

        return response()->json($congregation, 201);
    }

    public function show(Congregation $congregation): JsonResponse
    {
        return response()->json($congregation);
    }

    public function update(Request $request, Congregation $congregation): JsonResponse
    {
        $validated = $request->validate([
            'nome' => ['sometimes', 'required', 'string', 'max:255'],
            'cnpj' => ['nullable', 'string', 'max:255'],
            'endereco' => ['nullable', 'string', 'max:255'],
            'telefone' => ['nullable', 'string', 'max:50'],
            'pastor' => ['nullable', 'string', 'max:255'],
            'fundacao' => ['nullable', 'date'],
            'situacao' => ['nullable', 'string', 'max:50'],
        ]);

        $congregation->update($validated);

        return response()->json($congregation);
    }

    public function destroy(Congregation $congregation): JsonResponse
    {
        $congregation->delete();

        return response()->json([
            'message' => 'Congregação excluída com sucesso.',
        ]);
    }
}

