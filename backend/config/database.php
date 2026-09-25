<?php
declare(strict_types=1);

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = getenv('EMAII_DB_HOST') ?: '127.0.0.1';
    $port = getenv('EMAII_DB_PORT') ?: '3306';
    $name = getenv('EMAII_DB_NAME') ?: 'emaii';
    $user = getenv('EMAII_DB_USER') ?: 'root';
    $pass = getenv('EMAII_DB_PASS') ?: '';

    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        error_log('[EMAII] Falha de conexão MySQL: ' . $e->getMessage());
        throw new RuntimeException('Não foi possível conectar ao banco de dados.');
    }
    return $pdo;
}
