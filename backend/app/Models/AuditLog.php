<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'collection',
        'action',
        'label',
        'user_id',
    ];

    protected $appends = ['at'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getAtAttribute(): string
    {
        return $this->created_at?->toISOString() ?? '';
    }
}

