<?php
declare(strict_types=1);

namespace Scs;

/** RFC 6238 TOTP (SHA-1, 6 digits, 30s). Self-contained; no external dependency. */
final class Totp
{
    private const PERIOD = 30;
    private const DIGITS = 6;

    public static function generateSecret(int $bytes = 20): string
    {
        return self::base32Encode(random_bytes($bytes));
    }

    /** The code for a given unix time. */
    public static function codeAt(string $base32Secret, int $timestamp): string
    {
        $key = self::base32Decode($base32Secret);
        $counter = intdiv($timestamp, self::PERIOD);
        $binCounter = pack('N*', 0) . pack('N*', $counter); // 8-byte big-endian
        $hash = hash_hmac('sha1', $binCounter, $key, true);
        $offset = ord($hash[strlen($hash) - 1]) & 0x0F;
        $part = (
            ((ord($hash[$offset]) & 0x7F) << 24) |
            ((ord($hash[$offset + 1]) & 0xFF) << 16) |
            ((ord($hash[$offset + 2]) & 0xFF) << 8) |
            (ord($hash[$offset + 3]) & 0xFF)
        );
        $code = $part % (10 ** self::DIGITS);
        return str_pad((string) $code, self::DIGITS, '0', STR_PAD_LEFT);
    }

    /** Verify a code within +/- $window steps of $now (default now = time()). */
    public static function verify(string $base32Secret, string $code, ?int $now = null, int $window = 1): bool
    {
        $now ??= time();
        $code = trim($code);
        for ($i = -$window; $i <= $window; $i++) {
            if (hash_equals(self::codeAt($base32Secret, $now + $i * self::PERIOD), $code)) {
                return true;
            }
        }
        return false;
    }

    private static function base32Encode(string $data): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $out = '';
        $bits = 0;
        $value = 0;
        foreach (str_split($data) as $ch) {
            $value = ($value << 8) | ord($ch);
            $bits += 8;
            while ($bits >= 5) {
                $out .= $alphabet[($value >> ($bits - 5)) & 0x1F];
                $bits -= 5;
            }
        }
        if ($bits > 0) {
            $out .= $alphabet[($value << (5 - $bits)) & 0x1F];
        }
        return $out;
    }

    private static function base32Decode(string $b32): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $b32 = strtoupper(rtrim($b32, '='));
        $bits = 0;
        $value = 0;
        $out = '';
        foreach (str_split($b32) as $ch) {
            $idx = strpos($alphabet, $ch);
            if ($idx === false) continue;
            $value = ($value << 5) | $idx;
            $bits += 5;
            if ($bits >= 8) {
                $out .= chr(($value >> ($bits - 8)) & 0xFF);
                $bits -= 8;
            }
        }
        return $out;
    }
}
