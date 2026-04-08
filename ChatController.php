<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\SendMessageRequest;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\AI\AiChatService;
use App\Services\AI\ChatStreamService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    public function index(Request $request)
    {
        $items = $request->user()
            ->conversations()
            ->withCount('messages')
            ->latest('last_message_at')
            ->latest()
            ->limit(30)
            ->get();

        return ApiResponse::success([
            'items' => $items,
        ]);
    }

    public function show(Request $request, Conversation $conversation)
    {
        $this->ensureOwnership($request, $conversation);

        $conversation->load([
            'messages' => fn ($query) => $query->orderBy('id')->limit(100),
        ]);

        return ApiResponse::success([
            'conversation' => $conversation,
        ]);
    }

    public function send(SendMessageRequest $request, AiChatService $aiChatService)
    {
        $conversation = $this->resolveConversation($request);

        $userMessage = Message::query()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $request->user()->id,
            'role' => 'user',
            'body' => $request->string('message')->toString(),
            'status' => 'sent',
            'source' => 'web',
            'tokens_used' => 0,
            'meta' => [],
        ]);

        $reply = $aiChatService->buildAssistantReply($request->user(), $conversation, $userMessage->body, $request->validated());

        $assistantMessage = Message::query()->create([
            'conversation_id' => $conversation->id,
            'user_id' => null,
            'role' => 'assistant',
            'body' => $reply['content'],
            'status' => 'sent',
            'source' => $reply['meta']['provider'] ?? 'ai',
            'tokens_used' => 0,
            'meta' => $reply['meta'] ?? [],
        ]);

        $conversation->update([
            'title' => $conversation->title ?: Str::limit($userMessage->body, 60),
            'subject' => $request->input('subject', $conversation->subject),
            'status' => 'active',
            'last_message_at' => now(),
            'context' => array_filter([
                'stage' => $request->input('stage'),
                'grade' => $request->input('grade'),
                'term' => $request->input('term'),
                'subject' => $request->input('subject'),
            ]),
        ]);

        return ApiResponse::success([
            'conversation_id' => $conversation->id,
            'user_message' => $userMessage,
            'assistant_message' => $assistantMessage,
        ], 'تم إنشاء الرد بنجاح');
    }

    public function stream(SendMessageRequest $request, AiChatService $aiChatService, ChatStreamService $chatStreamService)
    {
        $conversation = $this->resolveConversation($request);
        $reply = $aiChatService->buildAssistantReply($request->user(), $conversation, $request->string('message')->toString(), $request->validated());

        return $chatStreamService->streamPlainText($reply['content']);
    }

    protected function resolveConversation(SendMessageRequest $request): Conversation
    {
        if ($request->filled('conversation_id')) {
            $conversation = Conversation::query()->findOrFail($request->integer('conversation_id'));
            $this->ensureOwnership($request, $conversation);

            return $conversation;
        }

        return Conversation::query()->create([
            'user_id' => $request->user()->id,
            'title' => null,
            'subject' => $request->input('subject'),
            'status' => 'active',
            'context' => [],
            'last_message_at' => now(),
        ]);
    }

    protected function ensureOwnership(Request $request, Conversation $conversation): void
    {
        abort_unless($conversation->user_id === $request->user()->id, 403);
    }
}

