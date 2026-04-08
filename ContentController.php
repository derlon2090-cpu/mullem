<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContentItem;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    public function index(Request $request)
    {
        $content = ContentItem::query()
            ->published()
            ->when($request->filled('stage'), fn ($query) => $query->where('stage', $request->string('stage')->toString()))
            ->when($request->filled('grade'), fn ($query) => $query->where('grade', $request->string('grade')->toString()))
            ->when($request->filled('subject'), fn ($query) => $query->where('subject', $request->string('subject')->toString()))
            ->when($request->filled('type'), fn ($query) => $query->where('type', $request->string('type')->toString()))
            ->latest('published_at')
            ->paginate(12);

        return ApiResponse::success([
            'items' => $content->items(),
            'pagination' => [
                'current_page' => $content->currentPage(),
                'last_page' => $content->lastPage(),
                'per_page' => $content->perPage(),
                'total' => $content->total(),
            ],
        ]);
    }

    public function show(ContentItem $contentItem)
    {
        abort_unless($contentItem->is_published, 404);

        return ApiResponse::success([
            'item' => $contentItem,
        ]);
    }
}

