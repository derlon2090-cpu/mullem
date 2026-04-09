<?php

use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\Admin\SearchConfigController;
use App\Http\Controllers\Api\Admin\UserManagementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\StudentDashboardController;
use App\Http\Controllers\Api\SystemController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [SystemController::class, 'health']);

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:8,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
});

Route::prefix('admin')->group(function (): void {
    Route::get('/db-status', [SystemController::class, 'dbStatus']);
    Route::get('/conversations', [SystemController::class, 'conversations']);
    Route::get('/search-config', [SearchConfigController::class, 'show']);
    Route::put('/search-config', [SearchConfigController::class, 'update']);
});

Route::prefix('chat')->group(function (): void {
    Route::post('/send', [ChatController::class, 'send'])->middleware(['api.token', 'throttle:20,1']);
    Route::post('/stream', [ChatController::class, 'stream'])->middleware(['api.token', 'throttle:20,1']);
});

Route::post('/solve-question', [ChatController::class, 'solveQuestion'])->middleware(['api.token', 'throttle:20,1']);

Route::middleware('api.token:true')->group(function (): void {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('throttle:20,1');

    Route::get('/student/dashboard', [StudentDashboardController::class, 'summary']);

    Route::prefix('chat')->group(function (): void {
        Route::get('/sessions', [ChatController::class, 'index']);
        Route::get('/sessions/{conversationId}', [ChatController::class, 'show']);
    });

    Route::prefix('admin')->group(function (): void {
        Route::get('/stats', [AdminDashboardController::class, 'stats']);
        Route::get('/users', [UserManagementController::class, 'index']);
        Route::patch('/users/{user}', [UserManagementController::class, 'update']);
    });
});
