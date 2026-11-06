<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contribution extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'membro',
        'tipo',
        'valor',
        'data',
        'pagamento',
        'congregacao',
    ];

    protected $casts = [
        'data' => 'date:Y-m-d',
        'valor' => 'float',
    ];
}

