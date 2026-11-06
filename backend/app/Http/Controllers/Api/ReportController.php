<?php

namespace App\Http\Controllers\Api;

use App\Models\Member;
use Illuminate\Http\JsonResponse;

class ReportController extends BaseApiController
{
    private array $buckets = [
        ['label' => '0–12', 'min' => 0, 'max' => 12],
        ['label' => '13–17', 'min' => 13, 'max' => 17],
        ['label' => '18–25', 'min' => 18, 'max' => 25],
        ['label' => '26–35', 'min' => 26, 'max' => 35],
        ['label' => '36–45', 'min' => 36, 'max' => 45],
        ['label' => '46–59', 'min' => 46, 'max' => 59],
        ['label' => '60–69', 'min' => 60, 'max' => 69],
        ['label' => '70+', 'min' => 70, 'max' => 200],
    ];

    public function membersByAge(): JsonResponse
    {
        $members = Member::whereNotNull('nascimento')->get();

        $list = $members->map(function ($m) {
            return [
                'id' => $m->id,
                'nome' => $m->nome,
                'nascimento' => $m->nascimento ? $m->nascimento->format('Y-m-d') : null,
                'idade' => $m->idade,
                'congregacao' => $m->congregacao,
                'situacao' => $m->situacao,
                'tipo' => $m->tipo,
            ];
        })->filter(fn($m) => $m['idade'] !== null)
          ->sortByDesc('idade')
          ->values();

        $counts = [];
        foreach ($this->buckets as $bucket) {
            $counts[$bucket['label']] = 0;
        }

        foreach ($list as $item) {
            $age = $item['idade'];
            $matched = false;
            foreach ($this->buckets as $b) {
                if ($age >= $b['min'] && $age <= $b['max']) {
                    $counts[$b['label']]++;
                    $matched = true;
                    break;
                }
            }
            if (!$matched && $age >= 70) {
                $counts['70+']++;
            }
        }

        $chart = [];
        foreach ($this->buckets as $b) {
            $chart[] = [
                'faixa' => $b['label'],
                'Membros' => $counts[$b['label']],
            ];
        }

        return response()->json([
            'chart' => $chart,
            'list' => $list,
        ]);
    }
}

