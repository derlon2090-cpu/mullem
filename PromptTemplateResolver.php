<?php

namespace App\Services\AI;

use App\Models\PromptTemplate;

class PromptTemplateResolver
{
    public function resolve(string $key): array
    {
        $template = PromptTemplate::query()
            ->where('key', $key)
            ->where('is_active', true)
            ->first();

        if ($template) {
            return [
                'key' => $template->key,
                'system_prompt' => $template->system_prompt,
                'user_prompt_prefix' => $template->user_prompt_prefix,
                'temperature' => $template->temperature,
                'metadata' => $template->metadata ?? [],
            ];
        }

        return [
            'key' => $key,
            'system_prompt' => 'You are Mullem AI, an educational assistant for Saudi curriculum students. Keep answers accurate, safe, and concise.',
            'user_prompt_prefix' => 'حل السؤال التالي بشكل احترافي ومباشر:',
            'temperature' => (float) config('mullem.ai.temperature', 0.2),
            'metadata' => [],
        ];
    }
}

