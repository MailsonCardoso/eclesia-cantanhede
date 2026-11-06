<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Congregation extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'nome',
        'cnpj',
        'endereco',
        'telefone',
        'pastor',
        'fundacao',
        'situacao',
    ];

    protected $casts = [
        'fundacao' => 'date:Y-m-d',
    ];
}

