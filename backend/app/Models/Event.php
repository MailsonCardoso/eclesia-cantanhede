<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'titulo',
        'data',
        'hora',
        'tipo',
        'local',
        'responsavel',
        'descricao',
    ];

    protected $casts = [
        'data' => 'date:Y-m-d',
    ];
}

