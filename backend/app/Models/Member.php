<?php

namespace App\Models;

use App\Traits\Auditable;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'cell_id',
        'father_id',
        'mother_id',
        'spouse_id',
        'father_name',
        'mother_name',
        'spouse_name',
        'cep',
        'logradouro',
        'bairro',
        'cidade',
        'uf',
        'category',
        'status',
        'role',
    ];

    protected $appends = ['estadoCivil', 'idade', 'name'];

    protected $casts = [
        'nascimento' => 'date:Y-m-d',
        'conversao' => 'date:Y-m-d',
        'batismo' => 'date:Y-m-d',
        'recebimento' => 'date:Y-m-d',
    ];

    public function getNameAttribute(): string
    {
        return $this->attributes['nome'] ?? '';
    }

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
        if (! $this->nascimento) {
            return null;
        }

        return Carbon::parse($this->nascimento)->age;
    }

    public function father(): BelongsTo
    {
        return $this->belongsTo(Member::class, 'father_id');
    }

    public function mother(): BelongsTo
    {
        return $this->belongsTo(Member::class, 'mother_id');
    }

    public function spouse(): BelongsTo
    {
        return $this->belongsTo(Member::class, 'spouse_id');
    }

    public function childrenAsFather(): HasMany
    {
        return $this->hasMany(Member::class, 'father_id');
    }

    public function childrenAsMother(): HasMany
    {
        return $this->hasMany(Member::class, 'mother_id');
    }
}
