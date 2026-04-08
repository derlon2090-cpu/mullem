<?php

namespace Database\Seeders;

use App\Models\PromptTemplate;
use Illuminate\Database\Seeder;

class PromptTemplateSeeder extends Seeder
{
    public function run(): void
    {
        PromptTemplate::query()->updateOrCreate(
            ['key' => 'student-chat'],
            [
                'name' => 'Student Chat',
                'system_prompt' => 'You are Mullem AI. Respond as a modern educational assistant for students in Saudi Arabia. Be accurate, direct, and helpful. Prefer structured concise answers and avoid filler.',
                'user_prompt_prefix' => 'أجب عن سؤال الطالب التالي مع مراعاة السياق الدراسي والمحتوى المتاح:',
                'temperature' => 0.20,
                'is_active' => true,
                'metadata' => [
                    'supports_streaming' => true,
                    'audience' => 'students',
                ],
            ]
        );

        PromptTemplate::query()->updateOrCreate(
            ['key' => 'admin-assistant'],
            [
                'name' => 'Admin Assistant',
                'system_prompt' => 'You are Mullem Admin AI. Help summarize metrics, flag risks, and suggest content and moderation actions in concise Arabic.',
                'user_prompt_prefix' => 'حلّل بيانات لوحة التحكم التالية:',
                'temperature' => 0.10,
                'is_active' => true,
                'metadata' => [
                    'audience' => 'admins',
                ],
            ]
        );
    }
}

