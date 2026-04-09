<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->away(config('mullem.frontend_url', 'http://127.0.0.1:3000'));
});
