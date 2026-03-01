<?php
/**
 * Helper untuk mengirim email OTP menggunakan PHPMailer + Gmail SMTP.
 */

require_once __DIR__ . '/email_config.php';
require_once __DIR__ . '/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/SMTP.php';
require_once __DIR__ . '/PHPMailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

function sendOTPEmail(string $toEmail, string $toName, string $otp, string $storeName): bool {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = MAIL_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = MAIL_USERNAME;
        $mail->Password   = MAIL_PASSWORD;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = MAIL_PORT;
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom(MAIL_FROM, MAIL_FROM_NAME);
        $mail->addAddress($toEmail, $toName);

        $mail->isHTML(true);
        $mail->Subject = "Kode Verifikasi Pendaftaran Toko – $storeName";
        $mail->Body    = "
        <div style='font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;'>
            <div style='background:#4f46e5;padding:24px;border-radius:16px 16px 0 0;text-align:center;'>
                <h1 style='color:white;margin:0;font-size:22px;'>🔐 Verifikasi Email</h1>
            </div>
            <div style='border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:32px;'>
                <p style='color:#334155;margin-bottom:8px;'>Halo, <strong>$toName</strong>!</p>
                <p style='color:#64748b;font-size:14px;margin-bottom:24px;'>
                    Terima kasih telah mendaftarkan toko <strong>$storeName</strong> di FreshClean POS.
                    Gunakan kode berikut untuk memverifikasi email Anda:
                </p>
                <div style='background:#f8fafc;border:2px dashed #c7d2fe;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;'>
                    <div style='font-size:48px;font-weight:bold;letter-spacing:12px;color:#4f46e5;'>$otp</div>
                    <div style='color:#94a3b8;font-size:13px;margin-top:8px;'>Berlaku selama <strong>10 menit</strong></div>
                </div>
                <p style='color:#94a3b8;font-size:12px;'>
                    Jika Anda tidak merasa mendaftar, abaikan email ini.
                </p>
            </div>
            <p style='text-align:center;color:#cbd5e1;font-size:11px;margin-top:16px;'>FreshClean POS • Sistem Manajemen Laundry</p>
        </div>";
        $mail->AltBody = "Kode OTP Anda: $otp (berlaku 10 menit)";

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log('Mailer Error: ' . $mail->ErrorInfo);
        return false;
    }
}
