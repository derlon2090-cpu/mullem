<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class OpenAiResponsesService
{
    public function isConfigured(): bool
    {
        return trim((string) config('mullem.ai.api_key', '')) !== '';
    }

    public function getModel(): string
    {
        return (string) config('mullem.ai.model', 'gpt-5.4-mini');
    }

    public function sendMessages(array $messages): array
    {
        $apiKey = trim((string) config('mullem.ai.api_key', ''));

        if ($apiKey === '') {
            throw new RuntimeException('OPENAI_API_KEY is not configured on the server.', 503);
        }

        $response = Http::timeout((int) config('mullem.ai.timeout', 25))
            ->withToken($apiKey)
            ->acceptJson()
            ->post((string) config('mullem.ai.endpoint', 'https://api.openai.com/v1/responses'), [
                'model' => $this->getModel(),
                'input' => $messages,
            ]);

        if (! $response->successful()) {
            $message = (string) ($response->json('error.message')
                ?? $response->json('message')
                ?? $response->body()
                ?? 'OpenAI API request failed.');

            throw new RuntimeException(trim($message) !== '' ? trim($message) : 'OpenAI API request failed.', $response->status() ?: 502);
        }

        $payload = $response->json();
        $text = $this->extractResponseText(is_array($payload) ? $payload : []);

        if ($text === '') {
            throw new RuntimeException('OpenAI API returned an empty response.', 502);
        }

        return [
            'text' => $text,
            'payload' => is_array($payload) ? $payload : [],
        ];
    }

    protected function extractResponseText(array $payload): string
    {
        if (! empty($payload['output_text']) && is_string($payload['output_text'])) {
            return trim($payload['output_text']);
        }

        $parts = [];
        foreach (($payload['output'] ?? []) as $item) {
            foreach (($item['content'] ?? []) as $block) {
                if (! empty($block['text']) && is_string($block['text'])) {
                    $parts[] = trim($block['text']);
                }

                if (! empty($block['output_text']) && is_string($block['output_text'])) {
                    $parts[] = trim($block['output_text']);
                }
            }
        }

        return trim(implode("\n\n", array_filter($parts)));
    }
}
