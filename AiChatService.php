<?php

namespace App\Services\AI;

use App\Models\ContentItem;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AiChatService
{
    public function __construct(
        protected PromptTemplateResolver $promptTemplateResolver
    ) {
    }

    public function buildAssistantReply(User $user, ?Conversation $conversation, string $message, array $filters = []): array
    {
        $message = $this->sanitizeMessage($message);
        $template = $this->promptTemplateResolver->resolve((string) config('mullem.ai.system_prompt_key', 'student-chat'));
        $contextItems = $this->loadContextItems($filters, $message);
        $fallback = $this->buildFallbackReply($message, $contextItems);
        $apiKey = config('mullem.ai.api_key');

        if (! $apiKey) {
            return $fallback;
        }

        $response = Http::timeout((int) config('mullem.ai.timeout', 20))
            ->withToken($apiKey)
            ->acceptJson()
            ->post((string) config('mullem.ai.endpoint'), [
                'model' => config('mullem.ai.model', 'gpt-5.4-mini'),
                'temperature' => $template['temperature'] ?? config('mullem.ai.temperature', 0.2),
                'input' => [
                    [
                        'role' => 'system',
                        'content' => [
                            ['type' => 'input_text', 'text' => $template['system_prompt']],
                        ],
                    ],
                    [
                        'role' => 'user',
                        'content' => [
                            ['type' => 'input_text', 'text' => $this->buildUserPrompt($template['user_prompt_prefix'] ?? '', $message, $contextItems, $conversation)],
                        ],
                    ],
                ],
            ]);

        if (! $response->successful()) {
            return $fallback;
        }

        $content = $response->json('output_text')
            ?? $response->json('output.0.content.0.text')
            ?? $response->json('choices.0.message.content');

        if (! is_string($content) || trim($content) === '') {
            return $fallback;
        }

        return [
            'content' => trim($content),
            'meta' => [
                'provider' => config('mullem.ai.provider', 'openai'),
                'model' => config('mullem.ai.model', 'gpt-5.4-mini'),
                'used_fallback' => false,
                'context_titles' => $contextItems->pluck('title')->values()->all(),
            ],
        ];
    }

    protected function sanitizeMessage(string $message): string
    {
        $message = strip_tags($message);
        $message = preg_replace('/\s+/u', ' ', $message) ?? $message;

        return trim(Str::limit($message, 5000, ''));
    }

    protected function loadContextItems(array $filters, string $message): Collection
    {
        $query = ContentItem::query()
            ->published()
            ->select(['id', 'title', 'excerpt', 'stage', 'grade', 'subject', 'lesson'])
            ->limit(3);

        foreach (['stage', 'grade', 'subject', 'term'] as $filterKey) {
            if (! empty($filters[$filterKey])) {
                $query->where($filterKey, $filters[$filterKey]);
            }
        }

        return $query
            ->orderByRaw('CASE WHEN title LIKE ? THEN 0 ELSE 1 END', ['%' . Str::limit($message, 40, '') . '%'])
            ->latest('published_at')
            ->get();
    }

    protected function buildUserPrompt(string $prefix, string $message, Collection $contextItems, ?Conversation $conversation): string
    {
        $context = $contextItems
            ->map(fn (ContentItem $item) => "- {$item->title}: " . ($item->excerpt ?: 'بدون ملخص'))
            ->implode("\n");

        $conversationLabel = $conversation?->title ? "عنوان المحادثة الحالية: {$conversation->title}\n" : '';

        return trim("{$prefix}\n{$conversationLabel}\nالسؤال:\n{$message}\n\nسياق منهجي متاح:\n{$context}");
    }

    protected function buildFallbackReply(string $message, Collection $contextItems): array
    {
        $contextText = $contextItems->isNotEmpty()
            ? "استنادًا إلى المحتوى المتاح: " . $contextItems->pluck('title')->implode('، ')
            : "لم أجد محتوى محليًا كافيًا، لذا أحتاج الرجوع لمصدر AI أو قاعدة المحتوى لاحقًا.";

        return [
            'content' => trim("{$contextText}\n\nالسؤال: {$message}\n\nسأقدّم لك جوابًا منظمًا ومختصرًا مع قابلية تطوير الرد لاحقًا إلى Streaming وWeb verification."),
            'meta' => [
                'provider' => 'fallback',
                'used_fallback' => true,
                'context_titles' => $contextItems->pluck('title')->values()->all(),
            ],
        ];
    }
}
