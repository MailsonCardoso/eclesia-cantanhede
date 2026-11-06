<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'nome',
        'lider',
        'integrantes',
        'descricao',
        'situacao',
    ];

    protected $casts = [
        'integrantes' => 'integer',
    ];
}

