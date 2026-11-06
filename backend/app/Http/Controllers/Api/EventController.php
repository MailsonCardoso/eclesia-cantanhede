<?php

namespace App\Http\Controllers\Api;

use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Event::query();

        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('titulo', 'like', "%{$q}%")
                    ->orWhere('local', 'like', "%{$q}%")
                    ->orWhere('responsavel', 'like', "%{$q}%")
                    ->orWhere('descricao', 'like', "%{$q}%");
            });
        }

        if ($request->filled('tipo') && $request->query('tipo') !== '__all') {
            $query->where('tipo', $request->query('tipo'));
        }

        if ($request->boolean('upcoming')) {
            $query->whereDate('data', '>=', now()->toDateString())
                ->orderBy('data')
                ->orderBy('hora');
        } else {
            $query->orderBy('data', 'desc');
        }

        $items = $query->get();

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'titulo' => ['required', 'string', 'max:255'],
            'data' => ['required', 'date'],
            'hora' => ['nullable', 'string', 'max:50'],
            'tipo' => ['nullable', 'string', 'max:100'],
            'local' => ['nullable', 'string', 'max:255'],
            'responsavel' => ['nullable', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
        ]);

        $event = Event::create($validated);

        return response()->json($event, 201);
    }

    public function show(Event $event): JsonResponse
    {
        return response()->json($event);
    }

    public function update(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate([
            'titulo' => ['sometimes', 'required', 'string', 'max:255'],
            'data' => ['sometimes', 'required', 'date'],
            'hora' => ['nullable', 'string', 'max:50'],
            'tipo' => ['nullable', 'string', 'max:100'],
            'local' => ['nullable', 'string', 'max:255'],
            'responsavel' => ['nullable', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
        ]);

        $event->update($validated);

        return response()->json($event);
    }

    public function destroy(Event $event): JsonResponse
    {
        $event->delete();

        return response()->json([
            'message' => 'Evento excluído com sucesso.',
        ]);
    }
}

