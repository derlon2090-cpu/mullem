<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PromptTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'name',
        'system_prompt',
        'user_prompt_prefix',
        'temperature',
        'is_active',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'temperature' => 'float',
            'is_active' => 'boolean',
            'metadata' => 'array',
        ];
    }
}

