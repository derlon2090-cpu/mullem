<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'role')) {
                $table->string('role', 50)->default('student')->after('password');
            }
            if (! Schema::hasColumn('users', 'stage')) {
                $table->string('stage', 60)->nullable()->after('role');
            }
            if (! Schema::hasColumn('users', 'grade')) {
                $table->string('grade', 60)->nullable()->after('stage');
            }
            if (! Schema::hasColumn('users', 'subject')) {
                $table->string('subject', 120)->nullable()->after('grade');
            }
            if (! Schema::hasColumn('users', 'package')) {
                $table->string('package', 120)->default('API Connected')->after('subject');
            }
            if (! Schema::hasColumn('users', 'xp')) {
                $table->unsignedInteger('xp')->default(100)->after('package');
            }
            if (! Schema::hasColumn('users', 'streak_days')) {
                $table->unsignedInteger('streak_days')->default(0)->after('xp');
            }
            if (! Schema::hasColumn('users', 'last_active_date')) {
                $table->date('last_active_date')->nullable()->after('streak_days');
            }
            if (! Schema::hasColumn('users', 'achievements')) {
                $table->json('achievements')->nullable()->after('last_active_date');
            }
            if (! Schema::hasColumn('users', 'status')) {
                $table->string('status', 50)->default('active')->after('achievements');
            }
            if (! Schema::hasColumn('users', 'activity')) {
                $table->string('activity', 255)->nullable()->after('status');
            }
            if (! Schema::hasColumn('users', 'phone')) {
                $table->string('phone', 30)->nullable()->after('activity');
            }
            if (! Schema::hasColumn('users', 'profile_meta')) {
                $table->json('profile_meta')->nullable()->after('phone');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table): void {
            foreach (['profile_meta', 'phone', 'activity', 'status', 'achievements', 'last_active_date', 'streak_days', 'xp', 'package', 'subject', 'grade', 'stage', 'role'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
