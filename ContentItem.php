<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'author_id',
        'type',
        'title',
        'slug',
        'body',
        'excerpt',
        'stage',
        'grade',
        'subject',
        'term',
        'lesson',
        'metadata',
        'is_published',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'is_published' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }
}
