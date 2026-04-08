<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContentItem;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ContentManagementController extends Controller
{
    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $items = ContentItem::query()
            ->latest()
            ->paginate(20);

        return ApiResponse::success([
            'items' => $items->items(),
            'pagination' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request);

        $validated = $this->validateContent($request);
        $validated['author_id'] = $request->user()->id;
        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['title'] . '-' . Str::random(5));

        $item = ContentItem::query()->create($validated);

        return ApiResponse::success([
            'item' => $item,
        ], 'تم إنشاء المحتوى', 201);
    }

    public function update(Request $request, ContentItem $contentItem)
    {
        $this->authorizeAdmin($request);

        $validated = $this->validateContent($request, $contentItem->id);
        $contentItem->update($validated);

        return ApiResponse::success([
            'item' => $contentItem->fresh(),
        ], 'تم تحديث المحتوى');
    }

    protected function validateContent(Request $request, ?int $ignoreId = null): array
    {
        $slugRule = 'unique:content_items,slug';
        if ($ignoreId) {
            $slugRule .= ',' . $ignoreId;
        }

        return $request->validate([
            'type' => ['required', 'string', 'max:60'],
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', $slugRule],
            'body' => ['required', 'string'],
            'excerpt' => ['nullable', 'string'],
            'stage' => ['nullable', 'string', 'max:60'],
            'grade' => ['nullable', 'string', 'max:60'],
            'subject' => ['nullable', 'string', 'max:80'],
            'term' => ['nullable', 'string', 'max:30'],
            'lesson' => ['nullable', 'string', 'max:160'],
            'metadata' => ['nullable', 'array'],
            'is_published' => ['nullable', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ]);
    }

    protected function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()?->isAdmin(), 403);
    }
}
