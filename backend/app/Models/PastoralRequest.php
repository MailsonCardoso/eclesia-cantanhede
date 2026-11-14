<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PastoralRequest extends Model
{
    use HasFactory, Auditable;

    protected $table = 'pastoral_requests';

    protected $fillable = [
        'person',
        'member_id',
        'type',
        'reason',
        'notes',
        'requested_at',
        'status',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class, 'member_id');
    }
}

