<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentDashboardController extends Controller
{
    public function summary(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return ApiResponse::error('يجب تسجيل الدخول أولًا.', 401);
        }

        $conversationsCount = DB::table('conversations')
            ->where('user_id', $user->id)
            ->count();

        $messagesCount = DB::table('messages')
            ->join('conversations', 'conversations.id', '=', 'messages.conversation_id')
            ->where('conversations.user_id', $user->id)
            ->count();

        $recentConversations = DB::table('conversations')
            ->select(['id', 'title', 'subject', 'grade', 'term', 'last_message_at', 'created_at'])
            ->where('user_id', $user->id)
            ->orderByRaw('COALESCE(last_message_at, created_at) DESC')
            ->limit(6)
            ->get();

        return ApiResponse::success([
            'user' => $user->toApiArray(),
            'stats' => [
                'conversations_count' => $conversationsCount,
                'messages_count' => $messagesCount,
                'xp' => (int) ($user->xp ?? 0),
                'streak_days' => (int) ($user->streak_days ?? 0),
            ],
            'recent_conversations' => $recentConversations,
        ]);
    }
}
