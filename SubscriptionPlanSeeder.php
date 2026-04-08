<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'code' => 'basic',
                'name' => 'الباقة الأساسية',
                'description' => 'وصول أساسي للشات والمحتوى الدراسي.',
                'price' => 29.00,
                'currency' => 'SAR',
                'billing_period' => 'monthly',
                'features' => ['chat_access', 'saved_sessions', 'basic_support'],
                'is_active' => true,
            ],
            [
                'code' => 'pro',
                'name' => 'الباقة الاحترافية',
                'description' => 'شات محسّن، جلسات محفوظة أكثر، وتجربة أسرع.',
                'price' => 59.00,
                'currency' => 'SAR',
                'billing_period' => 'monthly',
                'features' => ['chat_access', 'saved_sessions', 'priority_ai', 'content_tracking'],
                'is_active' => true,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::query()->updateOrCreate(
                ['code' => $plan['code']],
                $plan
            );
        }
    }
}
