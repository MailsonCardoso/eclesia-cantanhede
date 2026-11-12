<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PastorSermon extends Model
{
    use HasFactory, Auditable;

    protected $table = 'pastor_sermons';

    protected $fillable = [
        'title',
        'series',
        'series_id',
        'verse',
        'date',
        'status',
        'color',
        'content',
        'user_id',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'content' => 'array',
    ];

    public function seriesRelation(): BelongsTo
    {
        return $this->belongsTo(PastorSeries::class, 'series_id');
    }

    public function insights(): HasMany
    {
        return $this->hasMany(PastorInsight::class, 'sermon_id');
    }
}
