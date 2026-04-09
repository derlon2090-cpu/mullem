<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('conversations') || Schema::hasColumn('conversations', 'user_id')) {
            return;
        }

        Schema::table('conversations', function (Blueprint $table): void {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('conversations') || ! Schema::hasColumn('conversations', 'user_id')) {
            return;
        }

        Schema::table('conversations', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
