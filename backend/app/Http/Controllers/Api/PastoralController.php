<?php

namespace App\Http\Controllers\Api;

use App\Models\PastorInsight;
use App\Models\PastoralRequest;
use App\Models\PastorSeries;
use App\Models\PastorSermon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PastoralController extends BaseApiController
{
    // ==========================================
    // SÉRIES
    // ==========================================

    public function seriesIndex(): JsonResponse
    {
        $series = PastorSeries::withCount('sermons')
            ->orderByDesc('id')
            ->get();

        return response()->json($series);
    }

    public function seriesStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'total' => ['nullable', 'integer', 'min:1'],
            'completed' => ['nullable', 'integer', 'min:0'],
            'color' => ['nullable', 'string', 'max:50'],
            'cover_color' => ['nullable', 'string', 'max:100'],
            'start_date' => ['nullable', 'date'],
        ]);

        $series = PastorSeries::create($validated);

        return response()->json($series, 201);
    }

    public function seriesUpdate(Request $request, PastorSeries $series): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'total' => ['nullable', 'integer', 'min:1'],
            'completed' => ['nullable', 'integer', 'min:0'],
            'color' => ['nullable', 'string', 'max:50'],
            'cover_color' => ['nullable', 'string', 'max:100'],
            'start_date' => ['nullable', 'date'],
        ]);

        $series->update($validated);

        return response()->json($series);
    }

    public function seriesDestroy(PastorSeries $series): JsonResponse
    {
        $series->delete();

        return response()->json(['message' => 'Série excluída com sucesso.']);
    }

    // ==========================================
    // SERMÕES
    // ==========================================

    public function sermonsIndex(Request $request): JsonResponse
    {
        $query = PastorSermon::with(['seriesRelation', 'insights']);

        if ($request->filled('series_id')) {
            $query->where('series_id', $request->query('series_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $sermons = $query->orderByDesc('date')->get();

        return response()->json($sermons);
    }

    public function sermonStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'series' => ['nullable', 'string', 'max:255'],
            'series_id' => ['nullable', 'exists:pastor_series,id'],
            'verse' => ['nullable', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'status' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:50'],
            'content' => ['nullable', 'array'],
            'content.intro' => ['nullable', 'string'],
            'content.topics' => ['nullable', 'array'],
            'content.conclusion' => ['nullable', 'string'],
        ]);

        if (empty($validated['series']) && !empty($validated['series_id'])) {
            $series = PastorSeries::find($validated['series_id']);
            $validated['series'] = $series?->title ?? 'Avulso';
        }

        $sermon = PastorSermon::create($validated);
        $sermon->load(['seriesRelation', 'insights']);

        return response()->json($sermon, 201);
    }

    public function sermonShow(PastorSermon $sermon): JsonResponse
    {
        $sermon->load(['seriesRelation', 'insights']);

        return response()->json($sermon);
    }

    public function sermonUpdate(Request $request, PastorSermon $sermon): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'series' => ['nullable', 'string', 'max:255'],
            'series_id' => ['nullable', 'exists:pastor_series,id'],
            'verse' => ['nullable', 'string', 'max:255'],
            'date' => ['sometimes', 'required', 'date'],
            'status' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:50'],
            'content' => ['nullable', 'array'],
            'content.intro' => ['nullable', 'string'],
            'content.topics' => ['nullable', 'array'],
            'content.conclusion' => ['nullable', 'string'],
        ]);

        if (isset($validated['series_id']) && empty($validated['series'])) {
            $series = PastorSeries::find($validated['series_id']);
            $validated['series'] = $series?->title ?? 'Avulso';
        }

        $sermon->update($validated);
        $sermon->load(['seriesRelation', 'insights']);

        return response()->json($sermon);
    }

    public function sermonDestroy(PastorSermon $sermon): JsonResponse
    {
        $sermon->delete();

        return response()->json(['message' => 'Sermão excluído com sucesso.']);
    }

    // ==========================================
    // INSIGHTS
    // ==========================================

    public function insightsIndex(Request $request): JsonResponse
    {
        $query = PastorInsight::query()->with('sermon');

        if ($request->filled('sermon_id')) {
            $query->where('sermon_id', $request->query('sermon_id'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        $insights = $query->orderByDesc('id')->get();

        return response()->json($insights);
    }

    public function insightStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['nullable', 'string', 'in:note,verse,quote,illustration'],
            'title' => ['nullable', 'string', 'max:255'],
            'reference' => ['nullable', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'tags' => ['nullable', 'array'],
            'sermon_id' => ['nullable', 'exists:pastor_sermons,id'],
        ]);

        $insight = PastorInsight::create($validated);
        $insight->load('sermon');

        return response()->json($insight, 201);
    }

    public function insightUpdate(Request $request, PastorInsight $insight): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['nullable', 'string', 'in:note,verse,quote,illustration'],
            'title' => ['nullable', 'string', 'max:255'],
            'reference' => ['nullable', 'string', 'max:255'],
            'content' => ['sometimes', 'required', 'string'],
            'tags' => ['nullable', 'array'],
            'sermon_id' => ['nullable', 'exists:pastor_sermons,id'],
        ]);

        $insight->update($validated);
        $insight->load('sermon');

        return response()->json($insight);
    }

    public function insightDestroy(PastorInsight $insight): JsonResponse
    {
        $insight->delete();

        return response()->json(['message' => 'Insight excluído com sucesso.']);
    }

    // ==========================================
    // SOLICITAÇÕES PASTORAIS
    // ==========================================

    public function requestsIndex(Request $request): JsonResponse
    {
        $query = PastoralRequest::query()->with('member');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        $requests = $query->orderByDesc('requested_at')->get();

        return response()->json($requests);
    }

    public function requestStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'person' => ['required', 'string', 'max:255'],
            'member_id' => ['nullable', 'exists:members,id'],
            'type' => ['required', 'string', 'max:50'],
            'reason' => ['required', 'string'],
            'notes' => ['nullable', 'string'],
            'requested_at' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $validated['requested_at'] = $validated['requested_at'] ?? now();

        $req = PastoralRequest::create($validated);
        $req->load('member');

        return response()->json($req, 201);
    }

    public function requestUpdate(Request $request, PastoralRequest $pastoralRequest): JsonResponse
    {
        $validated = $request->validate([
            'person' => ['sometimes', 'required', 'string', 'max:255'],
            'member_id' => ['nullable', 'exists:members,id'],
            'type' => ['sometimes', 'required', 'string', 'max:50'],
            'reason' => ['sometimes', 'required', 'string'],
            'notes' => ['nullable', 'string'],
            'requested_at' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $pastoralRequest->update($validated);
        $pastoralRequest->load('member');

        return response()->json($pastoralRequest);
    }

    public function requestDestroy(PastoralRequest $pastoralRequest): JsonResponse
    {
        $pastoralRequest->delete();

        return response()->json(['message' => 'Solicitação excluída com sucesso.']);
    }
}
