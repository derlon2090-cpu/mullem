<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use App\Services\Payments\PaymentGatewayManager;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function checkout(Request $request, PaymentGatewayManager $paymentGatewayManager)
    {
        $validated = $request->validate([
            'plan_code' => ['required', 'string', 'exists:subscription_plans,code'],
            'gateway' => ['nullable', 'string'],
        ]);

        $plan = SubscriptionPlan::query()
            ->where('code', $validated['plan_code'])
            ->where('is_active', true)
            ->firstOrFail();

        $payload = $paymentGatewayManager->createCheckout(
            $request->user(),
            $plan,
            $validated['gateway'] ?? config('mullem.payments.default_gateway', 'myfatoorah')
        );

        return ApiResponse::success([
            'checkout' => $payload,
        ], 'تم إنشاء رابط الدفع');
    }

    public function webhook(string $gateway, Request $request)
    {
        return ApiResponse::success([
            'gateway' => $gateway,
            'received' => true,
            'payload' => $request->all(),
        ], 'تم استلام الـ webhook');
    }
}
