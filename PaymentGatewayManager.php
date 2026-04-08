<?php

namespace App\Services\Payments;

use App\Models\PaymentTransaction;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Support\Str;

class PaymentGatewayManager
{
    public function createCheckout(User $user, SubscriptionPlan $plan, string $gateway): array
    {
        $gateway = in_array($gateway, config('mullem.payments.supported_gateways', []), true)
            ? $gateway
            : config('mullem.payments.default_gateway', 'myfatoorah');

        $reference = strtoupper($gateway) . '-' . Str::uuid()->toString();

        $transaction = PaymentTransaction::query()->create([
            'user_id' => $user->id,
            'subscription_plan_id' => $plan->id,
            'gateway' => $gateway,
            'amount' => $plan->price,
            'currency' => $plan->currency,
            'status' => 'pending',
            'provider_reference' => $reference,
            'payload' => [
                'plan_code' => $plan->code,
                'user_email' => $user->email,
            ],
        ]);

        return [
            'gateway' => $gateway,
            'checkout_url' => rtrim((string) config('mullem.frontend_url'), '/') . '/subscriptions.html?tx=' . $transaction->id,
            'transaction_id' => $transaction->id,
            'provider_reference' => $reference,
            'amount' => $plan->price,
            'currency' => $plan->currency,
        ];
    }
}
