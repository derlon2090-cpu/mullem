<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContentItem;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\PromptTemplate;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $this->authorizeAdmin($request);

        return ApiResponse::success([
            'stats' => [
                'users_count' => User::query()->count(),
                'students_count' => User::query()->where('role', 'student')->count(),
                'admins_count' => User::query()->where('role', 'admin')->count(),
                'content_count' => ContentItem::query()->count(),
                'conversations_count' => Conversation::query()->count(),
                'messages_count' => Message::query()->count(),
                'active_prompt_templates' => PromptTemplate::query()->where('is_active', true)->count(),
            ],
        ]);
    }

    public function promptTemplates(Request $request)
    {
        $this->authorizeAdmin($request);

        return ApiResponse::success([
            'items' => PromptTemplate::query()->orderBy('name')->get(),
        ]);
    }

    public function updatePromptTemplate(Request $request, PromptTemplate $promptTemplate)
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'system_prompt' => ['sometimes', 'string'],
            'user_prompt_prefix' => ['sometimes', 'string'],
            'temperature' => ['sometimes', 'numeric', 'min:0', 'max:2'],
            'is_active' => ['sometimes', 'boolean'],
            'metadata' => ['sometimes', 'array'],
        ]);

        $promptTemplate->update($validated);

        return ApiResponse::success([
            'item' => $promptTemplate->fresh(),
        ], 'تم تحديث قالب الـ prompt');
    }

    protected function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()?->isAdmin(), 403);
    }
}

