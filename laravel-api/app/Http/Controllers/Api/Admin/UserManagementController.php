<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $users = User::query()
            ->when($request->filled('role'), fn ($query) => $query->where('role', $request->string('role')->toString()))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->latest('id')
            ->paginate((int) min(max($request->integer('per_page', 20), 1), 100));

        return ApiResponse::success([
            'items' => array_map(
                static fn (User $user) => $user->toApiArray(),
                $users->items()
            ),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function update(Request $request, User $user)
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $validated = $request->validate([
            'status' => ['sometimes', 'in:active,suspended,pending'],
            'role' => ['sometimes', 'in:student,admin'],
            'stage' => ['sometimes', 'nullable', 'string', 'max:60'],
            'grade' => ['sometimes', 'nullable', 'string', 'max:60'],
            'subject' => ['sometimes', 'nullable', 'string', 'max:120'],
            'xp' => ['sometimes', 'integer', 'min:0'],
        ]);

        $user->update($validated);

        return ApiResponse::success([
            'item' => $user->fresh()->toApiArray(),
        ], 'تم تحديث بيانات المستخدم');
    }
}
