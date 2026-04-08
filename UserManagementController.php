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
        $this->authorizeAdmin($request);

        $users = User::query()
            ->when($request->filled('role'), fn ($query) => $query->where('role', $request->string('role')->toString()))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->latest()
            ->paginate(20);

        return ApiResponse::success([
            'items' => $users->items(),
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
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'status' => ['sometimes', 'in:active,suspended,pending'],
            'role' => ['sometimes', 'in:student,teacher,parent,admin'],
            'stage' => ['sometimes', 'nullable', 'string', 'max:60'],
            'grade' => ['sometimes', 'nullable', 'string', 'max:60'],
        ]);

        $user->update($validated);

        return ApiResponse::success([
            'item' => $user->fresh(),
        ], 'تم تحديث بيانات المستخدم');
    }

    protected function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()?->isAdmin(), 403);
    }
}

