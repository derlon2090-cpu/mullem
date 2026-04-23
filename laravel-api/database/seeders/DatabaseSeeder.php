<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@mullem.sa'],
            [
                'name' => 'مشرف ملم',
                'password' => Hash::make('Mullem@2026'),
                'role' => 'admin',
                'stage' => 'عام',
                'grade' => 'الإدارة',
                'subject' => 'الإدارة',
                'package' => 'Admin',
                'xp' => 9999,
                'streak_days' => 0,
                'status' => 'active',
                'activity' => 'حساب الأدمن الرئيسي',
                'achievements' => [],
                'profile_meta' => [],
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'student@mullem.sa'],
            [
                'name' => 'طالب',
                'password' => Hash::make('Student@2026'),
                'role' => 'student',
                'stage' => 'ثانوي',
                'grade' => 'الثاني الثانوي',
                'subject' => 'الرياضيات',
                'package' => 'مجاني محدود',
                'xp' => 50,
                'streak_days' => 0,
                'status' => 'active',
                'activity' => 'حساب طالب جديد',
                'achievements' => [],
                'profile_meta' => [],
            ]
        );
    }
}
