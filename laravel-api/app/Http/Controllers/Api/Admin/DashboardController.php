<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();

        abort_unless($user?->isAdmin(), 403);

        return ApiResponse::success([
            'stats' => [
                'users_count' => DB::table('users')->count(),
                'students_count' => DB::table('users')->where('role', 'student')->count(),
                'admins_count' => DB::table('users')->where('role', 'admin')->count(),
                'conversations_count' => DB::table('conversations')->count(),
                'messages_count' => DB::table('messages')->count(),
                'active_users_count' => DB::table('users')->where('status', 'active')->count(),
            ],
        ]);
    }
}
