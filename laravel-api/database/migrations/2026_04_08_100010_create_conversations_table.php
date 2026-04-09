<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('conversations')) {
            return;
        }

        Schema::create('conversations', function (Blueprint $table): void {
            $table->string('id', 64)->primary();
            $table->string('guest_session_id')->nullable()->unique();
            $table->string('title')->nullable();
            $table->string('subject')->nullable();
            $table->string('stage', 100)->nullable();
            $table->string('grade', 100)->nullable();
            $table->string('term', 100)->nullable();
            $table->string('status', 50)->default('active');
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
