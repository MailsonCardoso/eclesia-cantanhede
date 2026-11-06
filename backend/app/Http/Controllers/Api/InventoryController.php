<?php

namespace App\Http\Controllers\Api;

use App\Models\Inventory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Inventory::query();

        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('nome', 'like', "%{$q}%")
                    ->orWhere('categoria', 'like', "%{$q}%")
                    ->orWhere('local', 'like', "%{$q}%");
            });
        }

        if ($request->filled('categoria') && $request->query('categoria') !== '__all') {
            $query->where('categoria', $request->query('categoria'));
        }

        if ($request->filled('estado') && $request->query('estado') !== '__all') {
            $query->where('estado', $request->query('estado'));
        }

        if ($request->filled('local') && $request->query('local') !== '__all') {
            $query->where('local', $request->query('local'));
        }

        $items = $query->orderBy('nome')->get();

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'categoria' => ['nullable', 'string', 'max:100'],
            'quantidade' => ['required', 'integer', 'min:0'],
            'estado' => ['nullable', 'string', 'max:50'],
            'local' => ['nullable', 'string', 'max:255'],
            'aquisicao' => ['nullable', 'date'],
            'valor' => ['nullable', 'numeric', 'min:0'],
            'observacoes' => ['nullable', 'string'],
        ]);

        $item = Inventory::create($validated);

        return response()->json($item, 201);
    }

    public function show(Inventory $inventory): JsonResponse
    {
        return response()->json($inventory);
    }

    public function update(Request $request, Inventory $inventory): JsonResponse
    {
        $validated = $request->validate([
            'nome' => ['sometimes', 'required', 'string', 'max:255'],
            'categoria' => ['nullable', 'string', 'max:100'],
            'quantidade' => ['sometimes', 'required', 'integer', 'min:0'],
            'estado' => ['nullable', 'string', 'max:50'],
            'local' => ['nullable', 'string', 'max:255'],
            'aquisicao' => ['nullable', 'date'],
            'valor' => ['nullable', 'numeric', 'min:0'],
            'observacoes' => ['nullable', 'string'],
        ]);

        $inventory->update($validated);

        return response()->json($inventory);
    }

    public function destroy(Inventory $inventory): JsonResponse
    {
        $inventory->delete();

        return response()->json([
            'message' => 'Item do inventário excluído com sucesso.',
        ]);
    }

    public function summary(): JsonResponse
    {
        $items = Inventory::all();
        $totalItens = $items->count();
        $totalUnidades = $items->sum('quantidade');
        $valorPatrimonio = $items->reduce(function ($carry, $item) {
            return $carry + ((float) $item->valor * (int) $item->quantidade);
        }, 0);

        return response()->json([
            'total_itens' => $totalItens,
            'total_unidades' => $totalUnidades,
            'valor_patrimonio' => $valorPatrimonio,
        ]);
    }
}

