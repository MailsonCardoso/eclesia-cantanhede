<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PastorInsight extends Model
{
    use HasFactory, Auditable;

    protected $table = 'pastor_insights';

    protected $fillable = [
        'type',
        'title',
        'reference',
        'content',
        'tags',
        'sermon_id',
        'user_id',
    ];

    protected $casts = [
        'tags' => 'array',
    ];

    public function sermon(): BelongsTo
    {
        return $this->belongsTo(PastorSermon::class, 'sermon_id');
    }
}

