<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChatSendRequest;
use App\Http\Requests\SolveQuestionRequest;
use App\Services\AI\OpenAiResponsesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    public function __construct(
        protected OpenAiResponsesService $openAiResponsesService
    ) {
    }

    public function send(ChatSendRequest $request): JsonResponse
    {
        try {
            $payload = $request->validated();
            $message = trim((string) ($payload['message'] ?? ''));
            $conversation = $this->getOrCreateConversation($payload, $request);

            DB::table('messages')->insert([
                'conversation_id' => $conversation->id,
                'role' => 'user',
                'body' => $message,
                'source' => 'web',
                'created_at' => now(),
            ]);

            $history = DB::table('messages')
                ->where('conversation_id', $conversation->id)
                ->orderByDesc('id')
                ->limit(10)
                ->get(['role', 'body'])
                ->reverse()
                ->values();

            $result = $this->openAiResponsesService->sendMessages(
                $this->buildChatMessages($history->all(), $payload)
            );

            $assistantBody = trim((string) $result['text']);

            DB::table('messages')->insert([
                'conversation_id' => $conversation->id,
                'role' => 'assistant',
                'body' => $assistantBody,
                'source' => 'openai',
                'created_at' => now(),
            ]);

            DB::table('conversations')
                ->where('id', $conversation->id)
                ->update([
                    'title' => $conversation->title ?: Str::limit($message, 60, ''),
                    'subject' => $payload['subject'] ?? $conversation->subject,
                    'stage' => $payload['stage'] ?? $conversation->stage,
                    'grade' => $payload['grade'] ?? $conversation->grade,
                    'term' => $payload['term'] ?? $conversation->term,
                    'last_message_at' => now(),
                    'updated_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'conversation_id' => $conversation->id,
                    'assistant_message' => [
                        'body' => $assistantBody,
                        'source' => 'openai',
                    ],
                ],
            ]);
        } catch (\Throwable $error) {
            return $this->errorResponse($error);
        }
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $guestSessionId = trim((string) $request->query('guest_session_id', ''));

        if (! $user && $guestSessionId === '') {
            return response()->json([
                'success' => false,
                'message' => 'يجب تسجيل الدخول أو إرسال guest_session_id صالح.',
            ], 401);
        }

        $items = DB::table('conversations')
            ->select([
                'id',
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
            ->when($user, fn ($query) => $query->where('user_id', $user->id))
            ->when(! $user && $guestSessionId !== '', fn ($query) => $query->where('guest_session_id', $guestSessionId))
            ->orderByRaw('COALESCE(last_message_at, created_at) DESC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $items,
            ],
        ]);
    }

    public function show(Request $request, string $conversationId): JsonResponse
    {
        $user = $request->user();
        $guestSessionId = trim((string) $request->query('guest_session_id', ''));

        $conversation = DB::table('conversations')
            ->where('id', $conversationId)
            ->when($user, fn ($query) => $query->where('user_id', $user->id))
            ->when(! $user && $guestSessionId !== '', fn ($query) => $query->where('guest_session_id', $guestSessionId))
            ->first();

        if (! $conversation) {
            return response()->json([
                'success' => false,
                'message' => 'لم يتم العثور على المحادثة المطلوبة.',
            ], 404);
        }

        $messages = DB::table('messages')
            ->where('conversation_id', $conversationId)
            ->orderBy('id')
            ->get(['id', 'role', 'body', 'source', 'created_at']);

        return response()->json([
            'success' => true,
            'data' => [
                'conversation' => $conversation,
                'messages' => $messages,
            ],
        ]);
    }

    public function solveQuestion(SolveQuestionRequest $request): JsonResponse
    {
        try {
            $payload = $request->validated();
            $question = trim((string) ($payload['question'] ?? ''));

            $result = $this->openAiResponsesService->sendMessages([
                [
                    'role' => 'system',
                    'content' => [
                        [
                            'type' => 'input_text',
                            'text' => $this->buildSolveSystemPrompt($payload),
                        ],
                    ],
                ],
            ]);

            $parsed = $this->extractJsonObject($result['text']);

            return response()->json(
                $this->normalizeSolvePayload($question, is_array($parsed) ? $parsed : [
                    'answer' => $result['text'],
                    'explanation' => '',
                    'display_text' => $result['text'],
                    'question_type' => 'general',
                    'confidence' => 0.72,
                ])
            );
        } catch (\Throwable $error) {
            return $this->errorResponse($error);
        }
    }

    public function stream(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Streaming is not enabled in this Laravel build yet.',
        ], 501);
    }

    protected function getOrCreateConversation(array $payload, Request $request): object
    {
        $conversationId = trim((string) ($payload['conversation_id'] ?? ''));
        $guestSessionId = trim((string) ($payload['guest_session_id'] ?? ''));
        $userId = $request->user()?->id;

        if ($conversationId !== '') {
            $conversation = DB::table('conversations')->where('id', $conversationId)->first();
            if ($conversation) {
                if ($userId && ! $conversation->user_id) {
                    DB::table('conversations')
                        ->where('id', $conversation->id)
                        ->update([
                            'user_id' => $userId,
                            'updated_at' => now(),
                        ]);

                    $conversation = DB::table('conversations')->where('id', $conversationId)->first();
                }

                return $conversation;
            }
        }

        if ($guestSessionId !== '') {
            $conversation = DB::table('conversations')->where('guest_session_id', $guestSessionId)->first();
            if ($conversation) {
                return $conversation;
            }
        }

        $id = (string) Str::uuid();
        $now = now();

        DB::table('conversations')->insert([
            'id' => $id,
            'user_id' => $userId,
            'guest_session_id' => $guestSessionId !== '' ? $guestSessionId : null,
            'title' => null,
            'subject' => $payload['subject'] ?? null,
            'stage' => $payload['stage'] ?? null,
            'grade' => $payload['grade'] ?? null,
            'term' => $payload['term'] ?? null,
            'status' => 'active',
            'last_message_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return DB::table('conversations')->where('id', $id)->first();
    }

    protected function buildChatMessages(array $history, array $payload): array
    {
        $messages = [
            [
                'role' => 'system',
                'content' => [
                    [
                        'type' => 'input_text',
                        'text' => $this->buildChatSystemPrompt($payload),
                    ],
                ],
            ],
        ];

        foreach ($history as $item) {
            $body = trim((string) ($item->body ?? ''));
            $role = trim((string) ($item->role ?? ''));

            if ($body === '' || $role === '') {
                continue;
            }

            $messages[] = [
                'role' => $role,
                'content' => [
                    [
                        'type' => 'input_text',
                        'text' => $body,
                    ],
                ],
            ];
        }

        return $messages;
    }

    protected function buildChatSystemPrompt(array $meta): string
    {
        $lines = [
            'أنت مساعد منصة ملم التعليمية.',
            'أجب بالعربية الواضحة والمباشرة.',
            'قدّم الجواب النهائي أولًا ثم شرحًا قصيرًا عند الحاجة.',
            'إذا كان السؤال دراسيًا فحلّه بدقة، وإذا كان طلب بحث أو شرح فاعرضه بشكل منظم ومفيد.',
            'لا تذكر تفاصيل داخلية عن المسارات أو الـ API أو الأنظمة الخلفية.',
        ];

        if (! empty($meta['subject'])) {
            $lines[] = 'المادة المرجحة: ' . $meta['subject'];
        }
        if (! empty($meta['grade'])) {
            $lines[] = 'الصف: ' . $meta['grade'];
        }
        if (! empty($meta['stage'])) {
            $lines[] = 'المرحلة: ' . $meta['stage'];
        }
        if (! empty($meta['term'])) {
            $lines[] = 'الفصل: ' . $meta['term'];
        }

        return implode("\n", $lines);
    }

    protected function buildSolveSystemPrompt(array $payload): string
    {
        return implode("\n", [
            'أنت محرك حل أسئلة تعليمية عربي لمنصة ملم.',
            'أعد JSON فقط بدون markdown أو أي نص زائد.',
            'اختر question_type من هذه القيم فقط: multiple_choice, true_false, fill_blank, matching, direct_math, definition, compound, general.',
            'إذا كان السؤال بحثًا أو شرحًا عامًا فاجعل question_type = general أو definition حسب الأنسب.',
            'answer يجب أن يكون الجواب النهائي.',
            'explanation شرح قصير ومباشر.',
            'display_text نص عربي جاهز للعرض للمستخدم بشكل مختصر ومفيد.',
            'confidence رقم بين 0 و 1.',
            'matched_source اجعله openai_api.',
            'source_trace مصفوفة تحتوي مصدرًا واحدًا على الأقل من نوع openai_api.',
            'answer_candidates يمكن أن تكون مصفوفة فارغة.',
            '',
            'السؤال: ' . trim((string) ($payload['question'] ?? '')),
            'الصف: ' . (trim((string) ($payload['grade'] ?? '')) ?: 'غير محدد'),
            'المادة: ' . (trim((string) ($payload['subject'] ?? '')) ?: 'غير محددة'),
            'الفصل: ' . (trim((string) ($payload['term'] ?? '')) ?: 'غير محدد'),
            'الدرس: ' . (trim((string) ($payload['lesson'] ?? '')) ?: 'غير محدد'),
        ]);
    }

    protected function extractJsonObject(string $text): ?array
    {
        $raw = trim($text);

        if ($raw === '') {
            return null;
        }

        if (preg_match('/```(?:json)?\s*([\s\S]*?)```/i', $raw, $matches)) {
            $raw = trim($matches[1]);
        }

        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        $start = strpos($raw, '{');
        $end = strrpos($raw, '}');

        if ($start !== false && $end !== false && $end > $start) {
            $decoded = json_decode(substr($raw, $start, $end - $start + 1), true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return null;
    }

    protected function normalizeSolvePayload(string $question, array $modelOutput): array
    {
        $questionType = $this->normalizeQuestionType((string) ($modelOutput['question_type'] ?? 'general'));
        $answer = trim((string) ($modelOutput['answer'] ?? $modelOutput['final_answer'] ?? $modelOutput['display_text'] ?? ''));
        $explanation = trim((string) ($modelOutput['explanation'] ?? ''));
        $displayText = trim((string) ($modelOutput['display_text'] ?? $answer ?: $explanation));
        $confidence = is_numeric($modelOutput['confidence'] ?? null)
            ? max(0, min(1, (float) $modelOutput['confidence']))
            : 0.78;

        return [
            'answer' => $answer !== '' ? $answer : ($displayText !== '' ? $displayText : 'تعذر استخراج جواب واضح من الرد الحالي.'),
            'explanation' => $explanation,
            'display_text' => $displayText !== '' ? $displayText : ($answer !== '' ? $answer : 'تعذر استخراج جواب واضح من الرد الحالي.'),
            'confidence' => $confidence,
            'matched_source' => 'openai_api',
            'source_trace' => ! empty($modelOutput['source_trace']) && is_array($modelOutput['source_trace'])
                ? $modelOutput['source_trace']
                : [[
                    'source' => 'openai_api',
                    'detail' => 'Generated by Laravel OpenAI Responses API',
                    'score' => $confidence,
                    'metadata' => new \stdClass(),
                ]],
            'answer_candidates' => ! empty($modelOutput['answer_candidates']) && is_array($modelOutput['answer_candidates'])
                ? $modelOutput['answer_candidates']
                : [],
            'hidden_analysis' => [
                'intent' => 'academic_question',
                'question_type' => $questionType,
                'original_question' => $question,
                'normalized_question' => mb_strtolower(trim($question)),
                'canonical_question' => mb_strtolower(trim($question)),
                'decision_basis' => 'approved_bank_then_curriculum_then_web',
                'agreement_level' => $confidence >= 0.9 ? 'high' : ($confidence >= 0.75 ? 'medium' : 'low'),
            ],
        ];
    }

    protected function normalizeQuestionType(string $value): string
    {
        $allowed = ['multiple_choice', 'true_false', 'fill_blank', 'matching', 'direct_math', 'definition', 'compound', 'general'];

        return in_array($value, $allowed, true) ? $value : 'general';
    }

    protected function errorResponse(\Throwable $error): JsonResponse
    {
        $status = (int) $error->getCode();
        if ($status < 400 || $status > 599) {
            $status = $error instanceof RuntimeException ? 503 : 500;
        }

        return response()->json([
            'success' => false,
            'message' => trim($error->getMessage()) !== '' ? $error->getMessage() : 'Internal server error',
        ], $status);
    }
}
