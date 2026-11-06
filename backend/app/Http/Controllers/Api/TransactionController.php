<?php

namespace App\Http\Controllers\Api;

use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::query();

        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('descricao', 'like', "%{$q}%")
                    ->orWhere('categoria', 'like', "%{$q}%")
                    ->orWhere('pagamento', 'like', "%{$q}%")
                    ->orWhere('conta', 'like', "%{$q}%");
            });
        }

        if ($request->filled('tipo') && $request->query('tipo') !== '__all') {
            $query->where('tipo', $request->query('tipo'));
        }

        if ($request->filled('categoria') && $request->query('categoria') !== '__all') {
            $query->where('categoria', $request->query('categoria'));
        }

        if ($request->filled('congregacao') && $request->query('congregacao') !== '__all') {
            $query->where('congregacao', $request->query('congregacao'));
        }

        if ($request->filled('start_date')) {
            $query->whereDate('data', '>=', $request->query('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->whereDate('data', '<=', $request->query('end_date'));
        }

        $items = $query->orderBy('data', 'desc')->get();

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'data' => ['required', 'date'],
            'tipo' => ['required', 'string', 'in:Receita,Despesa'],
            'categoria' => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string', 'max:255'],
            'valor' => ['required', 'numeric', 'min:0'],
            'pagamento' => ['nullable', 'string', 'max:100'],
            'conta' => ['nullable', 'string', 'max:100'],
            'congregacao' => ['nullable', 'string', 'max:255'],
            'comprovante' => ['nullable', 'string', 'max:255'],
        ]);

        $transaction = Transaction::create($validated);

        return response()->json($transaction, 201);
    }

    public function show(Transaction $transaction): JsonResponse
    {
        return response()->json($transaction);
    }

    public function update(Request $request, Transaction $transaction): JsonResponse
    {
        $validated = $request->validate([
            'data' => ['sometimes', 'required', 'date'],
            'tipo' => ['sometimes', 'required', 'string', 'in:Receita,Despesa'],
            'categoria' => ['sometimes', 'required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string', 'max:255'],
            'valor' => ['sometimes', 'required', 'numeric', 'min:0'],
            'pagamento' => ['nullable', 'string', 'max:100'],
            'conta' => ['nullable', 'string', 'max:100'],
            'congregacao' => ['nullable', 'string', 'max:255'],
            'comprovante' => ['nullable', 'string', 'max:255'],
        ]);

        $transaction->update($validated);

        return response()->json($transaction);
    }

    public function destroy(Transaction $transaction): JsonResponse
    {
        $transaction->delete();

        return response()->json([
            'message' => 'Lançamento financeiro excluído com sucesso.',
        ]);
    }

    public function summary(): JsonResponse
    {
        $receitas = (float) Transaction::where('tipo', 'Receita')->sum('valor');
        $despesas = (float) Transaction::where('tipo', 'Despesa')->sum('valor');
        $saldo = $receitas - $despesas;

        return response()->json([
            'receitas' => $receitas,
            'despesas' => $despesas,
            'saldo' => $saldo,
        ]);
    }
}

