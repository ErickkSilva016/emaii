<?php
declare(strict_types=1);

require_once __DIR__ . '/../auth/auth.php';
require_once __DIR__ . '/chat.php';

$allowedOrigin = getenv('EMAII_FRONTEND_ORIGIN') ?: '';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && $allowedOrigin !== '' && hash_equals($allowedOrigin, $origin)) {
    header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Vary: Origin');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (($_GET['action'] ?? '') === 'chat') {
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        header('Allow: POST');
        responder(['erro' => 'Método não permitido.'], 405);
    }
    try {
        tratarChat();
    } catch (Throwable $e) {
        error_log('[EMAII] Erro inesperado no suporte: ' . $e->getMessage());
        responder(['erro' => 'Erro interno no suporte. Tente novamente.', 'codigo' => 'interno'], 500);
    }
}

iniciarSessao();
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$action = (string) ($_GET['action'] ?? 'session');
$pdo = null;

try {
    $pdo = db();
    if ($action === 'session' && $method === 'GET') {
        $user = usuarioAtual();
        responder(['autenticado' => (bool) $user, 'usuario' => $user ? usuarioPublico($user) : null]);
    }
    if ($action === 'login' && $method === 'POST') login($pdo, corpoJson());
    if ($action === 'logout' && $method === 'POST') { $_SESSION = []; if (ini_get('session.use_cookies')) { $p = session_get_cookie_params(); setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'] ?? '', $p['secure'], $p['httponly']); } session_destroy(); responder(['ok' => true]); }

    $user = requireLogin();
    if ($action === 'bootstrap' && $method === 'GET') { $db = montarDb($pdo, $user); $sessao = array_values(array_filter($db['usuarios'], fn($item) => $item['id'] === $user['id']))[0] ?? usuarioPublico($user); responder(['usuario' => $sessao, 'db' => $db]); }
    if ($action === 'add_user' && $method === 'POST') { requireRole(['coordenador', 'diretor'], $user); adicionarUsuario($pdo, corpoJson()); }
    if ($action === 'add_student' && $method === 'POST') { requireRole('coordenador', $user); adicionarAluno($pdo, corpoJson()); }
    if ($action === 'update_student' && $method === 'POST') { requireRole('coordenador', $user); atualizarAluno($pdo, corpoJson()); }
    if ($action === 'add_announcement' && $method === 'POST') { requireRole('coordenador', $user); adicionarComunicado($pdo, $user, corpoJson()); }
    if ($action === 'add_attendance' && $method === 'POST') { requireRole('professor', $user); adicionarFrequencia($pdo, $user, corpoJson()); }
    if ($action === 'add_grade' && $method === 'POST') { requireRole('professor', $user); adicionarNota($pdo, $user, corpoJson()); }
    if ($action === 'add_activity' && $method === 'POST') { requireRole('professor', $user); adicionarAtividade($pdo, $user, corpoJson()); }
    if ($action === 'add_occurrence' && $method === 'POST') { requireRole('professor', $user); adicionarOcorrencia($pdo, $user, corpoJson()); }
    if ($action === 'add_observation' && $method === 'POST') { requireRole('professor', $user); adicionarObservacao($pdo, $user, corpoJson()); }
    if ($action === 'reset_demo' && $method === 'POST') { requireRole(['coordenador'], $user); responder(['erro' => 'A restauração global de dados deve ser feita pelo SQL de implantação, não pelo navegador.'], 403); }
    responder(['erro' => 'Endpoint não encontrado.'], 404);
} catch (Throwable $e) {
    error_log('[EMAII] API: ' . $e->getMessage());
    if ($e instanceof PDOException || $e instanceof RuntimeException) responder(['erro' => $e->getMessage() === 'Não foi possível conectar ao banco de dados.' ? $e->getMessage() : 'Não foi possível concluir a operação.'], 500);
    responder(['erro' => 'Não foi possível concluir a operação.'], 500);
}

function usuarioPublico(array $u): array
{
    $out = ['id' => $u['id'], 'nome' => $u['nome'], 'email' => $u['email'], 'role' => $u['tipo_usuario'], 'avatarCor' => $u['avatar_cor'], 'iniciais' => $u['iniciais']];
    return $out;
}

function login(PDO $pdo, array $data): never
{
    $email = strtolower(trim((string) ($data['email'] ?? '')));
    $senha = (string) ($data['senha'] ?? '');
    $roleEscolhida = (string) ($data['role'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $senha === '' || !in_array($roleEscolhida, ROLES_VALIDOS, true)) responder(['erro' => 'Informe e-mail, senha e perfil válidos.'], 422);
    $s = $pdo->prepare('SELECT * FROM usuarios WHERE email = ? AND ativo = 1 LIMIT 1'); $s->execute([$email]); $u = $s->fetch();
    if (!$u || !password_verify($senha, $u['senha'])) responder(['erro' => 'E-mail ou senha incorretos.'], 401);
    if (!hash_equals($u['tipo_usuario'], $roleEscolhida)) responder(['erro' => 'O perfil selecionado não corresponde ao perfil deste usuário.'], 403);
    session_regenerate_id(true); $_SESSION['user_id'] = $u['id']; $_SESSION['logged_at'] = time();
    responder(['ok' => true, 'usuario' => usuarioPublico($u)]);
}

function montarDb(PDO $pdo, array $user): array
{
    $db = ['disciplinas' => [], 'turmas' => [], 'alunos' => [], 'professores' => [], 'responsaveis' => [], 'usuarios' => [], 'notas' => [], 'frequencias' => [], 'ocorrencias' => [], 'atividades' => [], 'comunicados' => [], 'observacoes' => []];
    $db['disciplinas'] = $pdo->query('SELECT id, nome FROM disciplinas ORDER BY nome')->fetchAll();
    $db['turmas'] = $pdo->query('SELECT id, nome, serie, turno FROM turmas ORDER BY nome')->fetchAll();
    foreach ($db['turmas'] as &$t) {
        $s = $pdo->prepare('SELECT id FROM alunos WHERE turma_id = ? ORDER BY nome'); $s->execute([$t['id']]); $t['alunoIds'] = array_column($s->fetchAll(), 'id');
        $s = $pdo->prepare('SELECT professor_id FROM professor_turmas WHERE turma_id = ?'); $s->execute([$t['id']]); $t['professorIds'] = array_column($s->fetchAll(), 'professor_id');
        $s = $pdo->prepare('SELECT disciplina_id FROM turma_disciplinas WHERE turma_id = ?'); $s->execute([$t['id']]); $t['disciplinaIds'] = array_column($s->fetchAll(), 'disciplina_id');
    } unset($t);
    $db['alunos'] = $pdo->query('SELECT id, nome, matricula, turma_id AS turmaId, data_nascimento AS dataNascimento, situacao, iniciais, avatar_cor AS avatarCor FROM alunos ORDER BY nome')->fetchAll();
    $db['professores'] = $pdo->query('SELECT id, nome, email, iniciais FROM professores ORDER BY nome')->fetchAll();
    foreach ($db['professores'] as &$p) { $s=$pdo->prepare('SELECT turma_id FROM professor_turmas WHERE professor_id=?');$s->execute([$p['id']]);$p['turmaIds']=array_column($s->fetchAll(),'turma_id');$s=$pdo->prepare('SELECT disciplina_id FROM professor_disciplinas WHERE professor_id=?');$s->execute([$p['id']]);$p['disciplinaIds']=array_column($s->fetchAll(),'disciplina_id'); } unset($p);
    $db['responsaveis'] = $pdo->query('SELECT id, nome, email, iniciais FROM responsaveis ORDER BY nome')->fetchAll();
    foreach ($db['responsaveis'] as &$r) { $s=$pdo->prepare('SELECT aluno_id FROM responsavel_alunos WHERE responsavel_id=?');$s->execute([$r['id']]);$r['alunoIds']=array_column($s->fetchAll(),'aluno_id'); } unset($r);
    $db['notas'] = $pdo->query('SELECT id, aluno_id AS alunoId, disciplina_id AS disciplinaId, bimestre, valor, professor_id AS professorId, data_lancamento AS data FROM notas ORDER BY data_lancamento DESC')->fetchAll();
    $db['frequencias'] = $pdo->query('SELECT id, aluno_id AS alunoId, turma_id AS turmaId, disciplina_id AS disciplinaId, data, status, professor_id AS professorId FROM frequencias ORDER BY data DESC')->fetchAll();
    $db['ocorrencias'] = $pdo->query('SELECT id, aluno_id AS alunoId, turma_id AS turmaId, tipo, descricao, data, autor_id AS autorId, autor_nome AS autorNome FROM ocorrencias ORDER BY data DESC')->fetchAll();
    $db['atividades'] = $pdo->query('SELECT id, turma_id AS turmaId, disciplina_id AS disciplinaId, titulo, descricao, data_entrega AS dataEntrega, professor_id AS professorId, criada_em AS criadaEm FROM atividades ORDER BY criada_em DESC')->fetchAll();
    $db['comunicados'] = $pdo->query('SELECT id, titulo, mensagem, data, autor_id AS autorId, autor_nome AS autorNome, destinatarios FROM comunicados ORDER BY data DESC, id DESC')->fetchAll();
    $db['observacoes'] = $pdo->query('SELECT id, aluno_id AS alunoId, turma_id AS turmaId, texto, data, professor_id AS professorId, professor_nome AS professorNome FROM observacoes ORDER BY data DESC')->fetchAll();
    atualizarRelacionamentos($pdo, $db);
    if ($user['tipo_usuario'] === 'professor') filtrarProfessor($db, $user);
    if ($user['tipo_usuario'] === 'aluno') filtrarAluno($db, $user);
    if ($user['tipo_usuario'] === 'responsavel') filtrarResponsavel($db, $user);
    return $db;
}

function filtrarProfessor(array &$db, array $u): void { $s=db()->prepare('SELECT id FROM professores WHERE email=?');$s->execute([$u['email']]);$pid=$s->fetchColumn();$tids=array_values(array_filter(array_map(fn($x)=>$x['id'],array_filter($db['turmas'],fn($t)=>in_array($pid,$t['professorIds'],true)))));$db['turmas']=array_values(array_filter($db['turmas'],fn($t)=>in_array($t['id'],$tids,true)));$aids=[];foreach($db['turmas'] as $t)$aids=array_merge($aids,$t['alunoIds']);$db['alunos']=array_values(array_filter($db['alunos'],fn($a)=>in_array($a['id'],$aids,true)));$db['notas']=array_values(array_filter($db['notas'],fn($n)=>$n['professorId']===$pid));$db['frequencias']=array_values(array_filter($db['frequencias'],fn($n)=>$n['professorId']===$pid));$db['ocorrencias']=array_values(array_filter($db['ocorrencias'],fn($n)=>$n['autorId']===$u['id']));$db['atividades']=array_values(array_filter($db['atividades'],fn($n)=>$n['professorId']===$pid));$db['observacoes']=array_values(array_filter($db['observacoes'],fn($n)=>$n['professorId']===$pid)); }
function filtrarAluno(array &$db, array $u): void { $s=db()->prepare('SELECT aluno_id FROM usuarios WHERE id=?');$s->execute([$u['id']]);$aid=$s->fetchColumn();$aids=[$aid];$db['alunos']=array_values(array_filter($db['alunos'],fn($a)=>in_array($a['id'],$aids,true)));$tid=$db['alunos'][0]['turmaId']??null;$db['turmas']=array_values(array_filter($db['turmas'],fn($t)=>$t['id']===$tid));$db['notas']=array_values(array_filter($db['notas'],fn($n)=>$n['alunoId']===$aid));$db['frequencias']=array_values(array_filter($db['frequencias'],fn($n)=>$n['alunoId']===$aid));$db['ocorrencias']=array_values(array_filter($db['ocorrencias'],fn($n)=>$n['alunoId']===$aid));$db['atividades']=array_values(array_filter($db['atividades'],fn($n)=>$tid && $n['turmaId']===$tid)); }
function filtrarResponsavel(array &$db, array $u): void { $s=db()->prepare('SELECT responsavel_id FROM usuarios WHERE id=?');$s->execute([$u['id']]);$rid=$s->fetchColumn();$s=db()->prepare('SELECT aluno_id FROM responsavel_alunos WHERE responsavel_id=?');$s->execute([$rid]);$aids=array_column($s->fetchAll(),'aluno_id');$db['alunos']=array_values(array_filter($db['alunos'],fn($a)=>in_array($a['id'],$aids,true)));$tids=array_values(array_unique(array_map(fn($a)=>$a['turmaId'],$db['alunos'])));$db['turmas']=array_values(array_filter($db['turmas'],fn($t)=>in_array($t['id'],$tids,true)));$db['notas']=array_values(array_filter($db['notas'],fn($n)=>in_array($n['alunoId'],$aids,true)));$db['frequencias']=array_values(array_filter($db['frequencias'],fn($n)=>in_array($n['alunoId'],$aids,true)));$db['ocorrencias']=array_values(array_filter($db['ocorrencias'],fn($n)=>in_array($n['alunoId'],$aids,true)));$db['atividades']=array_values(array_filter($db['atividades'],fn($n)=>in_array($n['turmaId'],$tids,true))); }

function permissaoTurmaProfessor(PDO $pdo,array $u,string $turma):void { $s=$pdo->prepare('SELECT 1 FROM professor_turmas pt JOIN usuarios us ON us.professor_id=pt.professor_id WHERE us.id=? AND pt.turma_id=?');$s->execute([$u['id'],$turma]);if(!$s->fetchColumn())responder(['erro'=>'Você não tem permissão para esta turma.'],403); }
function permissaoAlunoProfessor(PDO $pdo,array $u,string $aid,string $turma):void { permissaoTurmaProfessor($pdo,$u,$turma);$s=$pdo->prepare('SELECT 1 FROM alunos WHERE id=? AND turma_id=?');$s->execute([$aid,$turma]);if(!$s->fetchColumn())responder(['erro'=>'Aluno não pertence à sua turma.'],403); }
function adicionarAluno(PDO $p,array $d):never { $nome=texto($d,'nome',150);$mat=texto($d,'matricula',50);$tid=texto($d,'turmaId',50);$nasc=texto($d,'dataNascimento',10,false);$sit=texto($d,'situacao',30)??'Regular';$id=idSeguro('a');$p->prepare('INSERT INTO alunos(id,nome,matricula,turma_id,data_nascimento,situacao,iniciais,avatar_cor) VALUES(?,?,?,?,?,?,?,?)')->execute([$id,$nome,$mat,$tid,$nasc,$sit, iniciais($nome), 'blue']);responder(['ok'=>true]); }
function atualizarAluno(PDO $p,array $d):never { $id=texto($d,'id',50);$nome=texto($d,'nome',150);$mat=texto($d,'matricula',50);$tid=texto($d,'turmaId',50);$nasc=texto($d,'dataNascimento',10,false);$sit=texto($d,'situacao',30)??'Regular';$p->prepare('UPDATE alunos SET nome=?,matricula=?,turma_id=?,data_nascimento=?,situacao=?,iniciais=? WHERE id=?')->execute([$nome,$mat,$tid,$nasc,$sit,iniciais($nome),$id]);responder(['ok'=>true]); }
function adicionarComunicado(PDO $p,array $u,array $d):never { $t=texto($d,'titulo',150);$m=texto($d,'mensagem',5000);$id=idSeguro('c');$p->prepare('INSERT INTO comunicados(id,titulo,mensagem,data,autor_id,autor_nome,destinatarios) VALUES(?,?,?,?,?,?,?)')->execute([$id,$t,$m,date('Y-m-d'),$u['id'],$u['nome'],'todos']);responder(['ok'=>true]); }
function professorId(PDO $p,array $u):string { $s=$p->prepare('SELECT professor_id FROM usuarios WHERE id=?');$s->execute([$u['id']]);return (string)$s->fetchColumn(); }
function adicionarFrequencia(PDO $p,array $u,array $d):never { $aid=texto($d,'alunoId',50);$tid=texto($d,'turmaId',50);$did=texto($d,'disciplinaId',50);$status=texto($d,'status',30);if(!in_array($status,['presente','falta','falta_justificada'],true))responder(['erro'=>'Situação de frequência inválida.'],422);permissaoAlunoProfessor($p,$u,$aid,$tid);$p->prepare('INSERT INTO frequencias(id,aluno_id,turma_id,disciplina_id,data,status,professor_id) VALUES(?,?,?,?,?,?,?)')->execute([idSeguro('f'),$aid,$tid,$did,texto($d,'data',10),$status,professorId($p,$u)]);responder(['ok'=>true]); }
function adicionarNota(PDO $p,array $u,array $d):never { $aid=texto($d,'alunoId',50);$did=texto($d,'disciplinaId',50);$tid=texto($d,'turmaId',50);$valor=(float)($d['valor']??-1);$b=(int)($d['bimestre']??0);if($valor<0||$valor>10||$b<1||$b>4)responder(['erro'=>'Nota ou bimestre inválido.'],422);permissaoAlunoProfessor($p,$u,$aid,$tid);$p->prepare('INSERT INTO notas(id,aluno_id,disciplina_id,bimestre,valor,professor_id,data_lancamento) VALUES(?,?,?,?,?,?,?)')->execute([idSeguro('n'),$aid,$did,$b,$valor,professorId($p,$u),date('Y-m-d')]);responder(['ok'=>true]); }
function adicionarAtividade(PDO $p,array $u,array $d):never { $tid=texto($d,'turmaId',50);$did=texto($d,'disciplinaId',50);permissaoTurmaProfessor($p,$u,$tid);$id=idSeguro('at');$p->prepare('INSERT INTO atividades(id,turma_id,disciplina_id,titulo,descricao,data_entrega,professor_id,criada_em) VALUES(?,?,?,?,?,?,?,?)')->execute([$id,$tid,$did, texto($d,'titulo',150),texto($d,'descricao',5000,false)??'',texto($d,'dataEntrega',10,false),professorId($p,$u),date('Y-m-d')]);responder(['ok'=>true]); }
function adicionarOcorrencia(PDO $p,array $u,array $d):never { $aid=texto($d,'alunoId',50);$tid=texto($d,'turmaId',50);permissaoAlunoProfessor($p,$u,$aid,$tid);$tipo=texto($d,'tipo',40);$p->prepare('INSERT INTO ocorrencias(id,aluno_id,turma_id,tipo,descricao,data,autor_id,autor_nome) VALUES(?,?,?,?,?,?,?,?)')->execute([idSeguro('o'),$aid,$tid,$tipo, texto($d,'descricao',5000),date('Y-m-d'),$u['id'],$u['nome']]);responder(['ok'=>true]); }
function adicionarObservacao(PDO $p,array $u,array $d):never { $aid=texto($d,'alunoId',50);$tid=texto($d,'turmaId',50);permissaoAlunoProfessor($p,$u,$aid,$tid);$p->prepare('INSERT INTO observacoes(id,aluno_id,turma_id,texto,data,professor_id,professor_nome) VALUES(?,?,?,?,?,?,?)')->execute([idSeguro('ob'),$aid,$tid,texto($d,'texto',5000),date('Y-m-d'),professorId($p,$u),$u['nome']]);responder(['ok'=>true]); }
function adicionarUsuario(PDO $p,array $d):never {
    $nome=texto($d,'nome',150); $email=strtolower((string)texto($d,'email',190)); $senha=(string)($d['senha']??''); $role=texto($d,'role',30);
    if(!filter_var($email,FILTER_VALIDATE_EMAIL)) responder(['erro'=>'Informe um e-mail válido.'],422);
    if(strlen($senha)<6) responder(['erro'=>'A senha deve ter pelo menos 6 caracteres.'],422);
    if(!in_array($role,ROLES_VALIDOS,true)) responder(['erro'=>'Perfil inválido.'],422);
    $avatar=texto($d,'avatarCor',20,false)??'blue'; $id=idSeguro('u'); $inic=iniciais($nome); $p->beginTransaction();
    try {
        $s=$p->prepare('SELECT 1 FROM usuarios WHERE email=?');$s->execute([$email]);if($s->fetchColumn())responder(['erro'=>'Já existe um usuário com este e-mail.'],409);
        $professorId=null;$alunoId=null;$responsavelId=null;
        if($role==='aluno') {
            $mat=texto($d,'matricula',50);$turma=texto($d,'turmaId',50);$nasc=texto($d,'dataNascimento',10,false);$situacao=texto($d,'situacao',30,false)??'Regular';
            $s=$p->prepare('SELECT 1 FROM alunos WHERE matricula=?');$s->execute([$mat]);if($s->fetchColumn())responder(['erro'=>'Já existe um aluno com esta matrícula.'],409);
            $alunoId=idSeguro('a');$p->prepare('INSERT INTO alunos(id,nome,matricula,turma_id,data_nascimento,situacao,iniciais,avatar_cor) VALUES(?,?,?,?,?,?,?,?)')->execute([$alunoId,$nome,$mat,$turma,$nasc,$situacao,$inic,$avatar]);
        } elseif($role==='professor') {
            $professorId=idSeguro('p');$p->prepare('INSERT INTO professores(id,nome,email,iniciais) VALUES(?,?,?,?)')->execute([$professorId,$nome,$email,$inic]);
            $turmas=array_values(array_filter(array_map('strval',(array)($d['turmaIds']??[]))));$disciplinas=array_values(array_filter(array_map('strval',(array)($d['disciplinaIds']??[]))));
            if(!$turmas) responder(['erro'=>'Professor precisa estar vinculado a pelo menos uma turma.'],422);
            $st=$p->prepare('INSERT INTO professor_turmas(professor_id,turma_id) VALUES(?,?)');foreach($turmas as $tid)$st->execute([$professorId,$tid]);$st=$p->prepare('INSERT INTO professor_disciplinas(professor_id,disciplina_id) VALUES(?,?)');foreach($disciplinas as $did)$st->execute([$professorId,$did]);
        } elseif($role==='responsavel') {
            $alunosVinculados=array_values(array_filter(array_map('strval',(array)($d['alunoIds']??[]))));if(!$alunosVinculados)responder(['erro'=>'Responsável precisa estar vinculado a pelo menos um aluno.'],422);$responsavelId=idSeguro('r');$p->prepare('INSERT INTO responsaveis(id,nome,email,iniciais) VALUES(?,?,?,?)')->execute([$responsavelId,$nome,$email,$inic]);$st=$p->prepare('INSERT INTO responsavel_alunos(responsavel_id,aluno_id) VALUES(?,?)');foreach($alunosVinculados as $aid)$st->execute([$responsavelId,$aid]);
        }
        $p->prepare('INSERT INTO usuarios(id,nome,email,senha,tipo_usuario,avatar_cor,iniciais,professor_id,aluno_id,responsavel_id) VALUES(?,?,?,?,?,?,?,?,?,?)')->execute([$id,$nome,$email,password_hash($senha,PASSWORD_DEFAULT),$role,$avatar,$inic,$professorId,$alunoId,$responsavelId]);$p->commit();responder(['ok'=>true,'id'=>$id]);
    } catch(Throwable $e) { if($p->inTransaction())$p->rollBack(); if($e instanceof PDOException && (int)$e->errorInfo[1]===1062)responder(['erro'=>'Já existe um cadastro com estes dados.'],409); throw $e; }
}
function iniciais(string $nome):string { $p=preg_split('/\s+/',trim($nome));return strtoupper(($p[0][0]??'').($p[1][0]??'')); }
