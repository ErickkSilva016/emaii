<?php
declare(strict_types=1);

// Execute apenas uma vez pelo terminal do XAMPP: php setup_test_users.php
// Depois, remova este arquivo do diretório público se não precisar mais dele.
require_once __DIR__ . '/config/database.php';

$pdo = db();
$senha = password_hash('123456', PASSWORD_DEFAULT);
$usuarios = [
    ['u-diretor', 'Antônio Ferreira', 'antonio.ferreira@emaii.edu.br', 'diretor', 'red', 'AF', null, null, null],
    ['u-coord', 'Carolina Reis', 'carolina.reis@emaii.edu.br', 'coordenador', 'red', 'CR', null, null, null],
    ['u-p1', 'Marcos Teixeira', 'marcos.teixeira@emaii.edu.br', 'professor', 'blue', 'MT', 'p1', null, null],
    ['u-a1', 'Rafael Lima', 'rafael.lima@aluno.emaii.edu.br', 'aluno', 'violet', 'RL', null, 'a1', null],
    ['u-r1', 'Sandra Lima', 'sandra.lima@email.com', 'responsavel', 'red', 'SL', null, null, 'r1'],
];
$sql = 'INSERT INTO usuarios (id,nome,email,senha,tipo_usuario,avatar_cor,iniciais,professor_id,aluno_id,responsavel_id) VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE senha=VALUES(senha), ativo=1';
$stmt = $pdo->prepare($sql);
foreach ($usuarios as $usuario) $stmt->execute([$usuario[0],$usuario[1],$usuario[2],$senha,$usuario[3],$usuario[4],$usuario[5],$usuario[6],$usuario[7],$usuario[8]]);
echo "Usuários de teste criados/atualizados. Senha comum: 123456\n";
