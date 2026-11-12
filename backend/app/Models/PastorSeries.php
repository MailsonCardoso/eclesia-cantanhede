<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PastorSeries extends Model
{
    use HasFactory, Auditable;

    protected $table = 'pastor_series';

    protected $fillable = [
        'title',
        'description',
        'total',
        'completed',
        'color',
        'cover_color',
        'start_date',
        'user_id',
    ];

    protected $appends = ['progress'];

    protected $casts = [
        'total' => 'integer',
        'completed' => 'integer',
        'start_date' => 'date:Y-m-d',
    ];

    public function getProgressAttribute(): int
    {
        if ($this->total <= 0) {
            return 0;
        }

        return (int) round(($this->completed / $this->total) * 100);
    }

    public function sermons(): HasMany
    {
        return $this->hasMany(PastorSermon::class, 'series_id');
    }
}
