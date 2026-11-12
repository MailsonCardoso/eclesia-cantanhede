<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'membro',
        'person',
        'member_id',
        'data',
        'hora',
        'start_time',
        'end_time',
        'location',
        'tipo',
        'motivo',
        'status',
        'observacoes',
    ];

    protected $casts = [
        'data' => 'date:Y-m-d',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class, 'member_id');
    }
}
