<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContentItem;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class StudentDashboardController extends Controller
{
    public function summary(Request $request)
    {
        $user = $request->user();

        $activeSubscription = $user->subscriptions()
            ->with('plan')
            ->where('status', 'active')
            ->latest('ends_at')
            ->first();

        $recommendedContent = ContentItem::query()
            ->published()
            ->when($user->stage, fn ($query) => $query->where('stage', $user->stage))
            ->when($user->grade, fn ($query) => $query->where('grade', $user->grade))
            ->latest('published_at')
            ->limit(5)
            ->get(['id', 'title', 'slug', 'subject', 'lesson']);

        return ApiResponse::success([
            'user' => $user->only(['id', 'name', 'email', 'stage', 'grade', 'role']),
            'stats' => [
                'conversations_count' => $user->conversations()->count(),
                'messages_count' => $user->messages()->count(),
                'active_subscription' => $activeSubscription?->plan?->only(['id', 'name', 'code', 'price', 'currency']),
            ],
            'recommended_content' => $recommendedContent,
        ]);
    }
}

