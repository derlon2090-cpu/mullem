<?php

use App\Http\Controllers\Api\Admin\ContentManagementController;
use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\Admin\UserManagementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\ContentController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\StudentDashboardController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:8,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
});

Route::post('/payments/webhook/{gateway}', [PaymentController::class, 'webhook']);

Route::prefix('chat')->group(function (): void {
    Route::post('/send', [ChatController::class, 'send'])->middleware('throttle:20,1');
    Route::post('/stream', [ChatController::class, 'stream'])->middleware('throttle:20,1');
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('throttle:20,1');

    Route::get('/student/dashboard', [StudentDashboardController::class, 'summary']);
    Route::get('/content', [ContentController::class, 'index']);
    Route::get('/content/{contentItem:slug}', [ContentController::class, 'show']);

    Route::prefix('chat')->group(function (): void {
        Route::get('/sessions', [ChatController::class, 'index']);
        Route::get('/sessions/{conversation}', [ChatController::class, 'show']);
    });

    Route::post('/payments/checkout', [PaymentController::class, 'checkout'])->middleware('throttle:10,1');

    Route::prefix('admin')->group(function (): void {
        Route::get('/stats', [AdminDashboardController::class, 'stats']);
        Route::get('/prompt-templates', [AdminDashboardController::class, 'promptTemplates']);
        Route::put('/prompt-templates/{promptTemplate}', [AdminDashboardController::class, 'updatePromptTemplate']);
        Route::get('/users', [UserManagementController::class, 'index']);
        Route::patch('/users/{user}', [UserManagementController::class, 'update']);
        Route::get('/content', [ContentManagementController::class, 'index']);
        Route::post('/content', [ContentManagementController::class, 'store']);
        Route::put('/content/{contentItem}', [ContentManagementController::class, 'update']);
    });
});
