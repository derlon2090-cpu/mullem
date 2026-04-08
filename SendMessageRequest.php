<?php

namespace App\Http\Requests\Chat;

use Illuminate\Foundation\Http\FormRequest;

class SendMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'conversation_id' => ['nullable', 'integer', 'exists:conversations,id'],
            'message' => ['required', 'string', 'min:1', 'max:10000'],
            'subject' => ['nullable', 'string', 'max:80'],
            'stage' => ['nullable', 'string', 'max:60'],
            'grade' => ['nullable', 'string', 'max:60'],
            'term' => ['nullable', 'string', 'max:30'],
            'stream' => ['nullable', 'boolean'],
        ];
    }
}

