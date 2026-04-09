<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchConfigController extends Controller
{
    protected array $defaultConfig = [
        'trusted_domains' => [
            'ien.edu.sa',
            'beitalelm.com',
            'mawdoo3.com',
        ],
        'serpapi_max_results' => 5,
        'serpapi_timeout_seconds' => 8,
    ];

    public function show(): JsonResponse
    {
        return response()->json($this->loadConfig());
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'trusted_domains' => ['required', 'array', 'min:1'],
            'trusted_domains.*' => ['string', 'max:255'],
        ]);

        $config = array_merge($this->loadConfig(), [
            'trusted_domains' => array_values(array_unique(array_map(
                static fn ($item) => strtolower(trim((string) $item)),
                $validated['trusted_domains']
            ))),
        ]);

        file_put_contents($this->getConfigPath(), json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        return response()->json($config);
    }

    protected function loadConfig(): array
    {
        $path = $this->getConfigPath();

        if (! is_file($path)) {
            return $this->defaultConfig;
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        return is_array($decoded) ? array_merge($this->defaultConfig, $decoded) : $this->defaultConfig;
    }

    protected function getConfigPath(): string
    {
        return base_path('../search_config.json');
    }
}
