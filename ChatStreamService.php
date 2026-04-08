<?php

namespace App\Services\AI;

use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatStreamService
{
    public function streamPlainText(string $content): StreamedResponse
    {
        return response()->stream(function () use ($content): void {
            $chunks = preg_split('/\s+/u', trim($content)) ?: [];

            foreach ($chunks as $chunk) {
                echo "event: token\n";
                echo 'data: ' . json_encode(['token' => $chunk . ' '], JSON_UNESCAPED_UNICODE) . "\n\n";
                @ob_flush();
                @flush();
                usleep(35000);
            }

            echo "event: done\n";
            echo 'data: ' . json_encode(['done' => true], JSON_UNESCAPED_UNICODE) . "\n\n";
            @ob_flush();
            @flush();
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache, no-transform',
            'X-Accel-Buffering' => 'no',
            'Connection' => 'keep-alive',
        ]);
    }
}

