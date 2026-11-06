<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'membro',
        'data',
        'hora',
        'tipo',
        'motivo',
        'status',
        'observacoes',
    ];

    protected $casts = [
        'data' => 'date:Y-m-d',
    ];
}

