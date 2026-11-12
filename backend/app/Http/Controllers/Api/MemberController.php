<?php

namespace App\Http\Controllers\Api;

use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Member::query()->with(['father', 'mother', 'spouse']);

        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('nome', 'like', "%{$q}%")
                    ->orWhere('cpf', 'like', "%{$q}%")
                    ->orWhere('telefone', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        if ($request->filled('congregacao') && $request->query('congregacao') !== '__all') {
            $query->where('congregacao', $request->query('congregacao'));
        }

        if ($request->filled('situacao') && $request->query('situacao') !== '__all') {
            $query->where('situacao', $request->query('situacao'));
        }

        if ($request->filled('tipo') && $request->query('tipo') !== '__all') {
            $query->where('tipo', $request->query('tipo'));
        }

        if ($request->filled('departamento') && $request->query('departamento') !== '__all') {
            $query->where('departamento', $request->query('departamento'));
        }

        $items = $query->orderBy('nome')->get();

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'cpf' => ['nullable', 'string', 'max:50'],
            'nascimento' => ['nullable', 'date'],
            'sexo' => ['nullable', 'string', 'max:50'],
            'estado_civil' => ['nullable', 'string', 'max:50'],
            'estadoCivil' => ['nullable', 'string', 'max:50'],
            'telefone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'endereco' => ['nullable', 'string', 'max:255'],
            'conversao' => ['nullable', 'date'],
            'batismo' => ['nullable', 'date'],
            'recebimento' => ['nullable', 'date'],
            'tipo' => ['nullable', 'string', 'max:50'],
            'situacao' => ['nullable', 'string', 'max:50'],
            'congregacao' => ['nullable', 'string', 'max:255'],
            'departamento' => ['nullable', 'string', 'max:255'],
            'cargo' => ['nullable', 'string', 'max:255'],
            'conjuge' => ['nullable', 'string', 'max:255'],
            'pai' => ['nullable', 'string', 'max:255'],
            'mae' => ['nullable', 'string', 'max:255'],
            'filhos' => ['nullable', 'string'],
            'observacoes' => ['nullable', 'string'],
            'cell_id' => ['nullable', 'integer'],
            'father_id' => ['nullable', 'exists:members,id'],
            'mother_id' => ['nullable', 'exists:members,id'],
            'spouse_id' => ['nullable', 'exists:members,id'],
            'father_name' => ['nullable', 'string', 'max:255'],
            'mother_name' => ['nullable', 'string', 'max:255'],
            'spouse_name' => ['nullable', 'string', 'max:255'],
            'cep' => ['nullable', 'string', 'max:15'],
            'logradouro' => ['nullable', 'string', 'max:255'],
            'bairro' => ['nullable', 'string', 'max:100'],
            'cidade' => ['nullable', 'string', 'max:100'],
            'uf' => ['nullable', 'string', 'max:5'],
            'category' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'max:50'],
            'role' => ['nullable', 'string', 'max:100'],
        ]);

        if (isset($validated['estadoCivil']) && !isset($validated['estado_civil'])) {
            $validated['estado_civil'] = $validated['estadoCivil'];
        }

        $member = Member::create($validated);
        $member->load(['father', 'mother', 'spouse']);

        return response()->json($member, 201);
    }

    public function show(Member $member): JsonResponse
    {
        $member->load(['father', 'mother', 'spouse']);

        return response()->json($member);
    }

    public function update(Request $request, Member $member): JsonResponse
    {
        $validated = $request->validate([
            'nome' => ['sometimes', 'required', 'string', 'max:255'],
            'cpf' => ['nullable', 'string', 'max:50'],
            'nascimento' => ['nullable', 'date'],
            'sexo' => ['nullable', 'string', 'max:50'],
            'estado_civil' => ['nullable', 'string', 'max:50'],
            'estadoCivil' => ['nullable', 'string', 'max:50'],
            'telefone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'endereco' => ['nullable', 'string', 'max:255'],
            'conversao' => ['nullable', 'date'],
            'batismo' => ['nullable', 'date'],
            'recebimento' => ['nullable', 'date'],
            'tipo' => ['nullable', 'string', 'max:50'],
            'situacao' => ['nullable', 'string', 'max:50'],
            'congregacao' => ['nullable', 'string', 'max:255'],
            'departamento' => ['nullable', 'string', 'max:255'],
            'cargo' => ['nullable', 'string', 'max:255'],
            'conjuge' => ['nullable', 'string', 'max:255'],
            'pai' => ['nullable', 'string', 'max:255'],
            'mae' => ['nullable', 'string', 'max:255'],
            'filhos' => ['nullable', 'string'],
            'observacoes' => ['nullable', 'string'],
            'cell_id' => ['nullable', 'integer'],
            'father_id' => ['nullable', 'exists:members,id'],
            'mother_id' => ['nullable', 'exists:members,id'],
            'spouse_id' => ['nullable', 'exists:members,id'],
            'father_name' => ['nullable', 'string', 'max:255'],
            'mother_name' => ['nullable', 'string', 'max:255'],
            'spouse_name' => ['nullable', 'string', 'max:255'],
            'cep' => ['nullable', 'string', 'max:15'],
            'logradouro' => ['nullable', 'string', 'max:255'],
            'bairro' => ['nullable', 'string', 'max:100'],
            'cidade' => ['nullable', 'string', 'max:100'],
            'uf' => ['nullable', 'string', 'max:5'],
            'category' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'max:50'],
            'role' => ['nullable', 'string', 'max:100'],
        ]);

        if (isset($validated['estadoCivil']) && !isset($validated['estado_civil'])) {
            $validated['estado_civil'] = $validated['estadoCivil'];
        }

        $member->update($validated);
        $member->load(['father', 'mother', 'spouse']);

        return response()->json($member);
    }

    public function destroy(Member $member): JsonResponse
    {
        $member->delete();

        return response()->json([
            'message' => 'Membro excluído com sucesso.',
        ]);
    }
}
