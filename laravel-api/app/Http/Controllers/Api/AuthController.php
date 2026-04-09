<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Support\ApiResponse;
use App\Support\ApiTokenManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(
        protected ApiTokenManager $tokens
    ) {
    }

    public function register(RegisterRequest $request)
    {
        $user = User::query()->create([
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->lower()->toString(),
            'password' => $request->string('password')->toString(),
            'role' => 'student',
            'stage' => $request->input('stage'),
            'grade' => $request->input('grade'),
            'phone' => $request->input('phone'),
            'subject' => 'الرياضيات',
            'package' => 'API Connected',
            'xp' => 100,
            'streak_days' => 0,
            'status' => 'active',
            'activity' => 'أنشأ حسابًا جديدًا',
            'achievements' => [],
            'profile_meta' => [],
        ]);

        $token = $this->tokens->issue($user, $request->input('device_name', 'mullem-web'));

        return ApiResponse::success([
            'token' => $token,
            'user' => $user->toApiArray(),
        ], 'تم إنشاء الحساب بنجاح', 201);
    }

    public function login(LoginRequest $request)
    {
        $user = User::query()
            ->where('email', $request->string('email')->lower()->toString())
            ->first();

        if (! $user || ! Hash::check($request->string('password')->toString(), $user->password)) {
            return ApiResponse::error('بيانات الدخول غير صحيحة', 422);
        }

        if ($user->status !== 'active') {
            return ApiResponse::error('الحساب غير نشط حاليًا', 403);
        }

        $user->forceFill([
            'activity' => $user->isAdmin() ? 'سجل دخولًا إلى لوحة الأدمن' : 'سجل دخولًا إلى لوحة الطالب',
            'last_active_date' => now()->toDateString(),
        ])->save();

        $token = $this->tokens->issue($user, $request->input('device_name', 'mullem-web'));

        return ApiResponse::success([
            'token' => $token,
            'user' => $user->fresh()->toApiArray(),
        ], 'تم تسجيل الدخول بنجاح');
    }

    public function me(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return ApiResponse::error('يجب تسجيل الدخول أولًا.', 401);
        }

        return ApiResponse::success([
            'user' => $user->toApiArray(),
        ]);
    }

    public function logout(Request $request)
    {
        $this->tokens->revokeCurrent($request);

        return ApiResponse::success([], 'تم تسجيل الخروج');
    }
}
