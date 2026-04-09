<?php

namespace App\Support;

use App\Models\ApiToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ApiTokenManager
{
    public function issue(User $user, string $name = 'web', array $meta = []): string
    {
        $plainTextToken = sprintf('%s.%s', Str::random(16), Str::random(48));

        ApiToken::query()->create([
            'user_id' => $user->id,
            'name' => $name,
            'token_hash' => hash('sha256', $plainTextToken),
            'last_used_at' => now(),
            'meta' => $meta,
        ]);

        return $plainTextToken;
    }

    public function resolve(string $plainTextToken): ?ApiToken
    {
        if (trim($plainTextToken) === '') {
            return null;
        }

        $token = ApiToken::query()
            ->with('user')
            ->where('token_hash', hash('sha256', $plainTextToken))
            ->first();

        if (! $token) {
            return null;
        }

        if ($token->expires_at && $token->expires_at->isPast()) {
            $token->delete();

            return null;
        }

        $token->forceFill(['last_used_at' => now()])->save();

        return $token;
    }

    public function revokeCurrent(Request $request): void
    {
        $tokenId = $request->attributes->get('api_token_id');

        if (! $tokenId) {
            return;
        }

        ApiToken::query()->whereKey($tokenId)->delete();
    }
}
