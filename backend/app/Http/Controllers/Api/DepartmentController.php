<?php

namespace App\Http\Controllers\Api;

use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Department::query();

        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('nome', 'like', "%{$q}%")
                    ->orWhere('lider', 'like', "%{$q}%")
                    ->orWhere('descricao', 'like', "%{$q}%");
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
            'lider' => ['nullable', 'string', 'max:255'],
            'integrantes' => ['nullable', 'integer', 'min:0'],
            'descricao' => ['nullable', 'string'],
            'situacao' => ['nullable', 'string', 'max:50'],
        ]);

        $department = Department::create($validated);

        return response()->json($department, 201);
    }

    public function show(Department $department): JsonResponse
    {
        return response()->json($department);
    }

    public function update(Request $request, Department $department): JsonResponse
    {
        $validated = $request->validate([
            'nome' => ['sometimes', 'required', 'string', 'max:255'],
            'lider' => ['nullable', 'string', 'max:255'],
            'integrantes' => ['nullable', 'integer', 'min:0'],
            'descricao' => ['nullable', 'string'],
            'situacao' => ['nullable', 'string', 'max:50'],
        ]);

        $department->update($validated);

        return response()->json($department);
    }

    public function destroy(Department $department): JsonResponse
    {
        $department->delete();

        return response()->json([
            'message' => 'Departamento excluído com sucesso.',
        ]);
    }
}

