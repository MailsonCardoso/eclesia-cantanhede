<?php

namespace App\Http\Controllers\Api;

use App\Models\Contribution;
use App\Models\Event;
use App\Models\Member;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends BaseApiController
{
    private array $monthsPt = [
        1 => 'Jan', 2 => 'Fev', 3 => 'Mar', 4 => 'Abr', 5 => 'Mai', 6 => 'Jun',
        7 => 'Jul', 8 => 'Ago', 9 => 'Set', 10 => 'Out', 11 => 'Nov', 12 => 'Dez',
    ];

    public function index(): JsonResponse
    {
        $now = Carbon::now();
        $currentYm = $now->format('Y-m');
        $currentMonth = $now->format('m');
        $today = $now->toDateString();

        $allMembers = Member::all();
        $totalMembers = $allMembers->count();
        $activeMembers = $allMembers->where('situacao', 'Ativo')->count();
        $congregados = $allMembers->where('tipo', 'Congregado')->count();

        $newMembersThisMonth = $allMembers->filter(function ($m) use ($currentYm) {
            return $m->recebimento && str_starts_with($m->recebimento->format('Y-m'), $currentYm);
        })->count();

        // Transações do mês atual
        $txMonth = Transaction::whereRaw("strftime('%Y-%m', data) = ?", [$currentYm])->get();
        $contribMonth = Contribution::whereRaw("strftime('%Y-%m', data) = ?", [$currentYm])->get();

        $txDizimos = (float) $txMonth->where('categoria', 'Dízimos')->sum('valor');
        $contribDizimos = (float) $contribMonth->where('tipo', 'Dízimo')->sum('valor');
        $dizimosNoMes = $txDizimos + $contribDizimos;

        $txOfertas = (float) $txMonth->where('tipo', 'Receita')->where('categoria', '!=', 'Dízimos')->sum('valor');
        $contribOfertas = (float) $contribMonth->where('tipo', '!=', 'Dízimo')->sum('valor');
        $ofertasNoMes = $txOfertas + $contribOfertas;

        $despesasNoMes = (float) $txMonth->where('tipo', 'Despesa')->sum('valor');
        $saldoNoMes = $dizimosNoMes + $ofertasNoMes - $despesasNoMes;

        // Saldo total acumulado
        $allTxReceitas = (float) Transaction::where('tipo', 'Receita')->sum('valor');
        $allTxDespesas = (float) Transaction::where('tipo', 'Despesa')->sum('valor');
        $allContribs = (float) Contribution::sum('valor');
        $saldoTotal = ($allTxReceitas - $allTxDespesas) + $allContribs;

        // Série histórica últimos 6 meses
        $series = [];
        for ($i = 5; $i >= 0; $i--) {
            $dt = $now->copy()->subMonths($i);
            $ym = $dt->format('Y-m');
            $mesName = $this->monthsPt[(int) $dt->format('n')] ?? $dt->format('M');

            $txs = Transaction::whereRaw("strftime('%Y-%m', data) = ?", [$ym])->get();
            $entradas = (float) $txs->where('tipo', 'Receita')->sum('valor');
            $saidas = (float) $txs->where('tipo', 'Despesa')->sum('valor');
            $membrosAteData = $allMembers->filter(function ($m) use ($ym) {
                return $m->recebimento && $m->recebimento->format('Y-m') <= $ym;
            })->count();

            $series[] = [
                'mes' => $mesName,
                'Entradas' => $entradas,
                'Saídas' => $saidas,
                'Membros' => $membrosAteData,
            ];
        }

        // Aniversariantes do mês
        $birthdays = $allMembers->filter(function ($m) use ($currentMonth) {
            return $m->nascimento && $m->nascimento->format('m') === $currentMonth;
        })->values();

        // Próximos eventos
        $upcomingEvents = Event::whereDate('data', '>=', $today)
            ->orderBy('data')
            ->orderBy('hora')
            ->limit(4)
            ->get();

        // Últimos membros cadastrados
        $latestMembers = Member::orderBy('recebimento', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'total_cadastrados' => $totalMembers,
            'membros_ativos' => $activeMembers,
            'novos_no_mes' => $newMembersThisMonth,
            'congregados' => $congregados,
            'dizimos_no_mes' => $dizimosNoMes,
            'ofertas_no_mes' => $ofertasNoMes,
            'despesas_no_mes' => $despesasNoMes,
            'saldo_no_mes' => $saldoNoMes,
            'saldo_total' => $saldoTotal,
            'series' => $series,
            'birthdays' => $birthdays,
            'upcoming_events' => $upcomingEvents,
            'latest_members' => $latestMembers,
        ]);
    }
}

