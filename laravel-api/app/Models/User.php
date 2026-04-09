<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'stage',
        'grade',
        'subject',
        'package',
        'xp',
        'streak_days',
        'last_active_date',
        'achievements',
        'status',
        'activity',
        'phone',
        'profile_meta',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_active_date' => 'date',
            'achievements' => 'array',
            'profile_meta' => 'array',
        ];
    }

    public function isAdmin(): bool
    {
        return strtolower((string) $this->role) === 'admin';
    }

    public function toApiArray(): array
    {
        return [
            'id' => (string) $this->id,
            'name' => (string) ($this->name ?? ''),
            'email' => strtolower((string) ($this->email ?? '')),
            'role' => strtolower((string) ($this->role ?? 'student')),
            'stage' => $this->stage,
            'grade' => $this->grade,
            'subject' => $this->subject,
            'package' => $this->package,
            'xp' => (int) ($this->xp ?? 0),
            'streakDays' => (int) ($this->streak_days ?? 0),
            'lastActiveDate' => optional($this->last_active_date)->toDateString(),
            'achievements' => is_array($this->achievements) ? $this->achievements : [],
            'status' => strtolower((string) ($this->status ?? 'active')),
            'activity' => $this->activity,
            'phone' => $this->phone,
        ];
    }
}
