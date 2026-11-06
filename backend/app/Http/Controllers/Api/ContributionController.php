<?php

namespace App\Http\Controllers\Api;

use App\Models\Contribution;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContributionController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Contribution::query();

        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('membro', 'like', "%{$q}%")
                    ->orWhere('tipo', 'like', "%{$q}%")
                    ->orWhere('pagamento', 'like', "%{$q}%");
            });
        }

        if ($request->filled('tipo') && $request->query('tipo') !== '__all') {
            $query->where('tipo', $request->query('tipo'));
        }

        if ($request->filled('congregacao') && $request->query('congregacao') !== '__all') {
            $query->where('congregacao', $request->query('congregacao'));
        }

        if ($request->filled('membro') && $request->query('membro') !== '__all') {
            $query->where('membro', $request->query('membro'));
        }

        $items = $query->orderBy('data', 'desc')->get();

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'membro' => ['nullable', 'string', 'max:255'],
            'tipo' => ['nullable', 'string', 'max:100'],
            'valor' => ['required', 'numeric', 'min:0'],
            'data' => ['required', 'date'],
            'pagamento' => ['nullable', 'string', 'max:100'],
            'congregacao' => ['nullable', 'string', 'max:255'],
        ]);

        if (empty($validated['membro'])) {
            $validated['membro'] = 'Anônimo';
        }

        $contribution = Contribution::create($validated);

        return response()->json($contribution, 201);
    }

    public function show(Contribution $contribution): JsonResponse
    {
        return response()->json($contribution);
    }

    public function update(Request $request, Contribution $contribution): JsonResponse
    {
        $validated = $request->validate([
            'membro' => ['nullable', 'string', 'max:255'],
            'tipo' => ['nullable', 'string', 'max:100'],
            'valor' => ['sometimes', 'required', 'numeric', 'min:0'],
            'data' => ['sometimes', 'required', 'date'],
            'pagamento' => ['nullable', 'string', 'max:100'],
            'congregacao' => ['nullable', 'string', 'max:255'],
        ]);

        $contribution->update($validated);

        return response()->json($contribution);
    }

    public function destroy(Contribution $contribution): JsonResponse
    {
        $contribution->delete();

        return response()->json([
            'message' => 'Contribuição excluída com sucesso.',
        ]);
    }
}

