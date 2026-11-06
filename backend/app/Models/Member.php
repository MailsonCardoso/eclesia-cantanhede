<?php

namespace App\Models;

use App\Traits\Auditable;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Member extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'nome',
        'cpf',
        'nascimento',
        'sexo',
        'estado_civil',
        'estadoCivil',
        'telefone',
        'email',
        'endereco',
        'conversao',
        'batismo',
        'recebimento',
        'tipo',
        'situacao',
        'congregacao',
        'departamento',
        'cargo',
        'conjuge',
        'pai',
        'mae',
        'filhos',
        'observacoes',
    ];

    protected $appends = ['estadoCivil', 'idade'];

    protected $casts = [
        'nascimento' => 'date:Y-m-d',
        'conversao' => 'date:Y-m-d',
        'batismo' => 'date:Y-m-d',
        'recebimento' => 'date:Y-m-d',
    ];

    public function getEstadoCivilAttribute(): ?string
    {
        return $this->attributes['estado_civil'] ?? null;
    }

    public function setEstadoCivilAttribute(?string $value): void
    {
        $this->attributes['estado_civil'] = $value;
    }

    public function getIdadeAttribute(): ?int
    {
        if (empty($this->nascimento)) {
            return null;
        }

        try {
            return Carbon::parse($this->nascimento)->age;
        } catch (\Throwable) {
            return null;
        }
    }
}

