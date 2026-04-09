<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AllowFrontendOrigins
{
    public function handle(Request $request, Closure $next): Response
    {
        $origin = (string) $request->headers->get('Origin', '');

        if ($request->getMethod() === 'OPTIONS') {
            $response = response('', 204);

            return $this->withCorsHeaders($response, $origin);
        }

        $response = $next($request);

        return $this->withCorsHeaders($response, $origin);
    }

    protected function withCorsHeaders(Response $response, string $origin): Response
    {
        if ($origin === '' || ! $this->isAllowedOrigin($origin)) {
            return $response;
        }

        $response->headers->set('Access-Control-Allow-Origin', $origin);
        $response->headers->set('Vary', 'Origin');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

        return $response;
    }

    protected function isAllowedOrigin(string $origin): bool
    {
        $allowed = array_filter([
            (string) config('mullem.frontend_url'),
            'http://127.0.0.1:3000',
            'http://localhost:3000',
            'http://127.0.0.1:8010',
            'http://localhost:8010',
        ]);

        return in_array(rtrim($origin, '/'), array_map(static fn ($item) => rtrim($item, '/'), $allowed), true);
    }
}
