<?php

return [
    'frontend_url' => env('MULLEM_FRONTEND_URL', 'http://127.0.0.1:3000'),
    'ai' => [
        'provider' => env('MULLEM_AI_PROVIDER', 'openai'),
        'api_key' => env('OPENAI_API_KEY'),
        'endpoint' => env('OPENAI_RESPONSES_ENDPOINT', 'https://api.openai.com/v1/responses'),
        'model' => env('OPENAI_MODEL', 'gpt-5.4-mini'),
        'timeout' => (int) env('OPENAI_TIMEOUT_MS', 25),
    ],
];
