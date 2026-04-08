<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\SendMessageRequest;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
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
        [$actor, $guestSessionId] = $this->resolveActor($request);
        $conversation = $this->resolveConversation($request, $actor, $guestSessionId);

        $userMessage = Message::query()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $actor->id,
            'role' => 'user',
            'body' => $request->string('message')->toString(),
            'status' => 'sent',
            'source' => 'web',
            'tokens_used' => 0,
            'meta' => [],
        ]);

        $reply = $aiChatService->buildAssistantReply($actor, $conversation, $userMessage->body, $request->validated());

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
                'guest_session_id' => $guestSessionId ?: data_get($conversation->context, 'guest_session_id'),
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
        [$actor, $guestSessionId] = $this->resolveActor($request);
        $conversation = $this->resolveConversation($request, $actor, $guestSessionId);
        $reply = $aiChatService->buildAssistantReply($actor, $conversation, $request->string('message')->toString(), $request->validated());

        return $chatStreamService->streamPlainText($reply['content']);
    }

    protected function resolveConversation(SendMessageRequest $request, User $actor, ?string $guestSessionId = null): Conversation
    {
        if ($request->filled('conversation_id')) {
            $conversation = Conversation::query()->findOrFail($request->integer('conversation_id'));
            $this->ensureOwnership($request, $conversation, $guestSessionId);

            return $conversation;
        }

        return Conversation::query()->create([
            'user_id' => $actor->id,
            'title' => null,
            'subject' => $request->input('subject'),
            'status' => 'active',
            'context' => array_filter([
                'guest_session_id' => $guestSessionId,
            ]),
            'last_message_at' => now(),
        ]);
    }

    protected function ensureOwnership(Request $request, Conversation $conversation, ?string $guestSessionId = null): void
    {
        if ($request->user()) {
            abort_unless($conversation->user_id === $request->user()->id, 403);
            return;
        }

        abort_unless(
            $guestSessionId && data_get($conversation->context, 'guest_session_id') === $guestSessionId,
            403
        );
    }

    protected function resolveActor(Request $request): array
    {
        $user = $request->user();
        if ($user) {
            return [$user, null];
        }

        return [$this->resolveGuestUser(), $this->resolveGuestSessionId($request)];
    }

    protected function resolveGuestUser(): User
    {
        return User::query()->firstOrCreate(
            ['email' => 'guest-chat@mullem.local'],
            [
                'name' => 'Guest Chat',
                'password' => Str::random(48),
                'role' => 'student',
                'status' => 'active',
                'profile_meta' => [
                    'system' => true,
                    'kind' => 'guest_chat_user',
                ],
            ]
        );
    }

    protected function resolveGuestSessionId(Request $request): string
    {
        $value = trim($request->input('guest_session_id', ''));

        return $value !== '' ? Str::limit($value, 120, '') : ('guest-' . Str::uuid()->toString());
    }
}
