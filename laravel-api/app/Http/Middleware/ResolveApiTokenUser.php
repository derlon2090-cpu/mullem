<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use App\Support\ApiTokenManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveApiTokenUser
{
    public function __construct(
        protected ApiTokenManager $tokens
    ) {
    }

    public function handle(Request $request, Closure $next, string $required = 'false'): Response
    {
        $bearerToken = (string) $request->bearerToken();

        if ($bearerToken !== '') {
            $token = $this->tokens->resolve($bearerToken);

            if ($token?->user) {
                $request->attributes->set('api_token_id', $token->id);
                $request->setUserResolver(static fn () => $token->user);
            }
        }

        if (filter_var($required, FILTER_VALIDATE_BOOLEAN) && ! $request->user()) {
            return ApiResponse::error('يجب تسجيل الدخول أولًا.', 401);
        }

        return $next($request);
    }
}
