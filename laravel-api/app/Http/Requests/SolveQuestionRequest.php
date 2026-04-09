<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SolveQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'question' => ['required', 'string', 'min:1', 'max:10000'],
            'subject' => ['nullable', 'string', 'max:255'],
            'stage' => ['nullable', 'string', 'max:100'],
            'grade' => ['nullable', 'string', 'max:100'],
            'term' => ['nullable', 'string', 'max:100'],
            'lesson' => ['nullable', 'string', 'max:255'],
        ];
    }
}
