<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AI\OpenAiResponsesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SystemController extends Controller
{
    public function __construct(
        protected OpenAiResponsesService $openAiResponsesService
    ) {
    }

    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'provider' => 'openai',
            'ai_configured' => $this->openAiResponsesService->isConfigured(),
            'model' => $this->openAiResponsesService->getModel(),
            'db' => $this->getDatabaseStatus(),
        ]);
    }

    public function dbStatus(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->getDatabaseStatus(),
        ]);
    }

    public function conversations(Request $request): JsonResponse
    {
        $status = $this->getDatabaseStatus();

        if (! $status['connected']) {
            return response()->json([
                'success' => false,
                'message' => $status['message'],
            ], 503);
        }

        $limit = max(1, min((int) $request->query('limit', 20), 100));

        $items = DB::table('conversations')
            ->select([
                'id',
                'guest_session_id',
                'title',
                'subject',
                'stage',
                'grade',
                'term',
                'status',
                'last_message_at',
                'created_at',
                'updated_at',
            ])
            ->orderByRaw('COALESCE(last_message_at, created_at) DESC')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $items,
            ],
        ]);
    }

    protected function getDatabaseStatus(): array
    {
        try {
            DB::connection()->getPdo();

            return [
                'configured' => true,
                'connected' => true,
                'host' => (string) config('database.connections.mysql.host'),
                'port' => (int) config('database.connections.mysql.port'),
                'database' => (string) config('database.connections.mysql.database'),
                'message' => 'MySQL connected successfully.',
            ];
        } catch (\Throwable $error) {
            return [
                'configured' => true,
                'connected' => false,
                'host' => (string) config('database.connections.mysql.host'),
                'port' => (int) config('database.connections.mysql.port'),
                'database' => (string) config('database.connections.mysql.database'),
                'message' => $error->getMessage(),
            ];
        }
    }
}
