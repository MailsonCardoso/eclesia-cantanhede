<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'data',
        'tipo',
        'categoria',
        'descricao',
        'valor',
        'pagamento',
        'conta',
        'congregacao',
        'comprovante',
    ];

    protected $casts = [
        'data' => 'date:Y-m-d',
        'valor' => 'float',
    ];
}

