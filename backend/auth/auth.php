<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

const ROLES_VALIDOS = ['coordenador', 'diretor', 'aluno', 'professor', 'responsavel'];

function iniciarSessao(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_name('EMAIISESSID');
    $sameSite = getenv('EMAII_SESSION_SAMESITE') ?: 'Lax';
    if (!in_array($sameSite, ['Lax', 'Strict', 'None'], true)) $sameSite = 'Lax';
    $forwardedProto = strtolower(trim(explode(',', $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')[0]));
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $forwardedProto === 'https' || $sameSite === 'None';
    session_set_cookie_params([
        'httponly' => true,
        'secure' => $secure,
        'samesite' => $sameSite,
        'path' => '/',
    ]);
    session_start();
}

function usuarioAtual(): ?array
{
    iniciarSessao();
    if (empty($_SESSION['user_id'])) return null;
    $stmt = db()->prepare('SELECT id, nome, email, tipo_usuario, avatar_cor, iniciais, professor_id, aluno_id, responsavel_id FROM usuarios WHERE id = ? AND ativo = 1');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    if (!$user) {
        $_SESSION = [];
        return null;
    }
    return $user;
}

function requireLogin(): array
{
    $user = usuarioAtual();
    if (!$user) responder(['erro' => 'Sessão expirada. Faça login novamente.'], 401);
    return $user;
}

function requireRole(array|string $roles, ?array $user = null): array
{
    $user ??= requireLogin();
    $roles = is_array($roles) ? $roles : [$roles];
    if (!in_array($user['tipo_usuario'], $roles, true)) {
        responder(['erro' => 'Você não tem permissão para executar esta ação.'], 403);
    }
    return $user;
}

function hasRole(array|string $roles, ?array $user = null): bool
{
    $user ??= usuarioAtual();
    if (!$user) return false;
    $roles = is_array($roles) ? $roles : [$roles];
    return in_array($user['tipo_usuario'], $roles, true);
}

function responder(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function corpoJson(): array
{
    $raw = file_get_contents('php://input') ?: '{}';
    $data = json_decode($raw, true);
    if (!is_array($data)) responder(['erro' => 'Requisição inválida.'], 400);
    return $data;
}

function texto(array $data, string $key, int $max = 255, bool $required = true): ?string
{
    $value = isset($data[$key]) ? trim((string) $data[$key]) : '';
    if ($required && $value === '') responder(['erro' => "O campo {$key} é obrigatório."], 422);
    if ($value === '') return null;
    return function_exists('mb_substr') ? mb_substr($value, 0, $max) : substr($value, 0, $max);
}

function idSeguro(string $prefix): string
{
    return $prefix . '-' . bin2hex(random_bytes(8));
}

function atualizarRelacionamentos(PDO $pdo, array &$db): void
{
    $users = $pdo->query('SELECT id, nome, email, tipo_usuario AS role, avatar_cor AS avatarCor, iniciais, professor_id, aluno_id, responsavel_id FROM usuarios WHERE ativo = 1 ORDER BY nome')->fetchAll();
    foreach ($users as &$u) {
        if ($u['role'] === 'professor') {
            $s = $pdo->prepare('SELECT turma_id FROM professor_turmas WHERE professor_id = ?'); $s->execute([$u['professor_id']]); $u['turmaIds'] = array_column($s->fetchAll(), 'turma_id');
            $s = $pdo->prepare('SELECT disciplina_id FROM professor_disciplinas WHERE professor_id = ?'); $s->execute([$u['professor_id']]); $u['disciplinas'] = array_column($s->fetchAll(), 'disciplina_id');
        } elseif ($u['role'] === 'aluno') {
            $s = $pdo->prepare('SELECT turma_id FROM alunos WHERE id = ?'); $s->execute([$u['aluno_id']]); $u['turmaId'] = $s->fetchColumn() ?: null;
        } elseif ($u['role'] === 'responsavel') {
            $s = $pdo->prepare('SELECT aluno_id FROM responsavel_alunos WHERE responsavel_id = ?'); $s->execute([$u['responsavel_id']]); $u['alunoIds'] = array_column($s->fetchAll(), 'aluno_id');
        }
        unset($u['professor_id'], $u['aluno_id'], $u['responsavel_id']);
    }
    unset($u);
    $db['usuarios'] = $users;
}
