<?php

return [
    'frontend_url' => env('MULLEM_FRONTEND_URL', 'https://mullem.sa'),

    'ai' => [
        'provider' => env('MULLEM_AI_PROVIDER', 'openai'),
        'api_key' => env('OPENAI_API_KEY'),
        'endpoint' => env('OPENAI_RESPONSES_ENDPOINT', 'https://api.openai.com/v1/responses'),
        'model' => env('OPENAI_MODEL', 'gpt-5.4-mini'),
        'temperature' => (float) env('MULLEM_AI_TEMPERATURE', 0.2),
        'timeout' => (int) env('MULLEM_AI_TIMEOUT', 20),
        'stream' => (bool) env('MULLEM_AI_STREAM', true),
        'system_prompt_key' => env('MULLEM_AI_PROMPT_KEY', 'student-chat'),
    ],

    'payments' => [
        'default_gateway' => env('MULLEM_PAYMENT_GATEWAY', 'myfatoorah'),
        'supported_gateways' => ['myfatoorah', 'tap', 'hyperpay'],
    ],
];

