<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChatSendRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'conversation_id' => ['nullable', 'string', 'max:64'],
            'guest_session_id' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'min:1', 'max:10000'],
            'subject' => ['nullable', 'string', 'max:255'],
            'stage' => ['nullable', 'string', 'max:100'],
            'grade' => ['nullable', 'string', 'max:100'],
            'term' => ['nullable', 'string', 'max:100'],
        ];
    }
}
