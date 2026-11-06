<?php

namespace App\Http\Controllers\Api;

use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppointmentController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Appointment::query();

        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('membro', 'like', "%{$q}%")
                    ->orWhere('motivo', 'like', "%{$q}%")
                    ->orWhere('observacoes', 'like', "%{$q}%");
            });
        }

        if ($request->filled('tipo') && $request->query('tipo') !== '__all') {
            $query->where('tipo', $request->query('tipo'));
        }

        if ($request->filled('status') && $request->query('status') !== '__all') {
            $query->where('status', $request->query('status'));
        }

        $items = $query->orderBy('data', 'desc')->orderBy('hora')->get();

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'membro' => ['required', 'string', 'max:255'],
            'data' => ['required', 'date'],
            'hora' => ['nullable', 'string', 'max:50'],
            'tipo' => ['nullable', 'string', 'max:100'],
            'motivo' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:50'],
            'observacoes' => ['nullable', 'string'],
        ]);

        $appointment = Appointment::create($validated);

        return response()->json($appointment, 201);
    }

    public function show(Appointment $appointment): JsonResponse
    {
        return response()->json($appointment);
    }

    public function update(Request $request, Appointment $appointment): JsonResponse
    {
        $validated = $request->validate([
            'membro' => ['sometimes', 'required', 'string', 'max:255'],
            'data' => ['sometimes', 'required', 'date'],
            'hora' => ['nullable', 'string', 'max:50'],
            'tipo' => ['nullable', 'string', 'max:100'],
            'motivo' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:50'],
            'observacoes' => ['nullable', 'string'],
        ]);

        $appointment->update($validated);

        return response()->json($appointment);
    }

    public function destroy(Appointment $appointment): JsonResponse
    {
        $appointment->delete();

        return response()->json([
            'message' => 'Agendamento pastoral excluído com sucesso.',
        ]);
    }
}

