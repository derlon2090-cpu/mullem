<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
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
            'status' => 'active',
            'profile_meta' => [],
        ]);

        $token = $user->createToken($request->input('device_name', 'web'))->plainTextToken;

        return ApiResponse::success([
            'token' => $token,
            'user' => $user->only(['id', 'name', 'email', 'role', 'stage', 'grade', 'status']),
        ], 'تم إنشاء الحساب بنجاح', 201);
    }

    public function login(LoginRequest $request)
    {
        $user = User::query()->where('email', $request->string('email')->lower()->toString())->first();

        if (! $user || ! Hash::check($request->string('password')->toString(), $user->password)) {
            return ApiResponse::error('بيانات الدخول غير صحيحة', 422);
        }

        if ($user->status !== 'active') {
            return ApiResponse::error('الحساب غير نشط حاليًا', 403);
        }

        $token = $user->createToken($request->input('device_name', 'web'))->plainTextToken;

        return ApiResponse::success([
            'token' => $token,
            'user' => $user->only(['id', 'name', 'email', 'role', 'stage', 'grade', 'status']),
        ], 'تم تسجيل الدخول بنجاح');
    }

    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return ApiResponse::success([], 'تم تسجيل الخروج');
    }
}

