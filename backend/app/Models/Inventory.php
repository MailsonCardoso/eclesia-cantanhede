<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory, Auditable;

    protected $table = 'inventories';

    public string $collectionName = 'inventory';

    protected $fillable = [
        'nome',
        'categoria',
        'quantidade',
        'estado',
        'local',
        'aquisicao',
        'valor',
        'observacoes',
    ];

    protected $casts = [
        'quantidade' => 'integer',
        'valor' => 'float',
        'aquisicao' => 'date:Y-m-d',
    ];
}

