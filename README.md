# EMAII — Sistema de Diário Escolar

O EMAII separa a interface estática do backend: `frontend/` contém o site e `backend/` contém uma única API PHP para operações acadêmicas e suporte, além da conexão PDO com MySQL. O navegador não decide a role, não armazena senha e não guarda os dados acadêmicos em `localStorage`.

## Estrutura implementada

- `frontend/index.html`, `frontend/css/`, `frontend/js/` e `frontend/assets/`: interface, scripts de navegador e mídia.
- `frontend/build.js`: publica os arquivos estáticos e injeta a URL da API configurada no build.
- `backend/api/index.php`: endpoints de autenticação, leitura e operações acadêmicas.
- `backend/api/chat.php`: endpoint do chat Gemini chamado pela mesma API PHP.
- `backend/auth/` e `backend/config/`: sessões, permissões e conexão PDO centralizada.
- `backend/database.sql`: arquivo SQL original, movido sem alteração; nenhuma migração é executada pelo deploy.
- `backend/setup_test_users.php`: utilitário de teste, não incluído na imagem pública do backend.

## DEPLOY NETLIFY + RENDER

O frontend é publicado como site estático no Netlify. O Render executa um único serviço PHP que atende tanto as operações acadêmicas quanto o chat. O MySQL permanece externo e não é criado nem migrado pelo deploy.

### Netlify

- Conecte o repositório e use a configuração de [`netlify.toml`](netlify.toml): base `frontend`, build `node build.js`, publicação `dist`.
- `API_URL` aponta para a URL completa da API PHP, terminando em `/api/index.php`; já está definida no `netlify.toml` e pode ser sobrescrita nas variáveis do site.
- O chat usa essa mesma URL com `?action=chat`. Não existe `SUPPORT_API_URL`.
- O build exige somente `API_URL` e não grava uma segunda URL de backend.

### Render

O [`render.yaml`](render.yaml) descreve um único serviço web PHP via Docker, usando PHP 8.3/Apache e `pdo_mysql`. O comando de inicialização é o `CMD` do Dockerfile.

Configure no serviço PHP `EMAII_DB_HOST`, `EMAII_DB_PORT`, `EMAII_DB_NAME`, `EMAII_DB_USER`, `EMAII_DB_PASS`, `EMAII_FRONTEND_ORIGIN` (origem exata do site Netlify) e `GEMINI_API_KEY`. `GEMINI_MODEL` é opcional. O blueprint define `EMAII_SESSION_SAMESITE=None` e persiste os arquivos de sessão em um disco Render. Esse disco exige plano pago, força uma única instância e causa indisponibilidade breve em deploys; sem ele, sessões podem sumir em reinícios. O banco MySQL existente precisa aceitar conexões do Render. Nenhum banco Render ou migração é criado.

O CORS da API permite somente `EMAII_FRONTEND_ORIGIN`. Para login via cookie, o frontend envia credenciais e o cookie usa `SameSite=None; Secure`. Para maior compatibilidade com bloqueio de cookies de terceiros, use domínios próprios sob o mesmo domínio registrável para Netlify e Render, por exemplo `app.exemplo.com` e `api.exemplo.com`.

Se o serviço antigo `emaii-support` já existir na conta Render, valide primeiro o chat pela API PHP e depois exclua o serviço Node manualmente no painel. Remover a definição do `render.yaml` não apaga recursos existentes.

## CONFIGURAÇÃO NO XAMPP

1. Instale o XAMPP com Apache, PHP e MySQL.
2. Copie a pasta do projeto para:
   `C:\xampp\htdocs\emaii\`
3. Abra o painel do XAMPP e inicie **Apache** e **MySQL**.
4. Não abra o arquivo com `file:///...`. Acesse pelo Apache:
   `http://localhost/emaii/frontend/`
5. Se a pasta tiver outro nome, use esse nome na URL.
6. Se o MySQL do XAMPP usar senha, configure as variáveis `EMAII_DB_HOST`, `EMAII_DB_PORT`, `EMAII_DB_NAME`, `EMAII_DB_USER` e `EMAII_DB_PASS` no ambiente do Apache, ou ajuste somente a configuração central em `backend/config/database.php`.

Para habilitar o chat local, configure `GEMINI_API_KEY` no ambiente do Apache. O chat é atendido pela mesma API PHP; não é necessário iniciar um serviço Node.

## CONFIGURAÇÃO NO PHPMYADMIN

1. Abra o XAMPP.
2. Inicie **Apache**.
3. Inicie **MySQL**.
4. Acesse `http://localhost/phpmyadmin`.
5. Abra a aba **SQL** (o script abaixo cria o banco `emaii` sem usar `DROP DATABASE` nem `DROP TABLE`).
6. Cole e execute o conteúdo completo de [`backend/database.sql`](backend/database.sql).
7. Confira se o banco `emaii` foi criado e se as tabelas aparecem.
8. Confira os relacionamentos nas tabelas `responsavel_alunos`, `professor_turmas`, `professor_disciplinas` e `turma_disciplinas`.
9. O SQL já cria os usuários de teste com hashes bcrypt. Se precisar recriá-los, execute pelo terminal na pasta do projeto:

```bash
php backend/setup_test_users.php
```

O arquivo usa `password_hash()` e a senha de teste não é gravada em texto puro. Apague `backend/setup_test_users.php` depois dos testes, se não precisar mais dele.

O SQL completo está no arquivo [`backend/database.sql`](backend/database.sql), pronto para copiar e colar no phpMyAdmin.

## USUÁRIOS DE TESTE

Todos usam a senha de teste **`123456`**:

| Perfil | E-mail |
|---|---|
| Diretor | `antonio.ferreira@emaii.edu.br` |
| Coordenador | `carolina.reis@emaii.edu.br` |
| Professor | `marcos.teixeira@emaii.edu.br` |
| Aluno | `rafael.lima@aluno.emaii.edu.br` |
| Responsável | `sandra.lima@email.com` |

O perfil selecionado no card é apenas uma indicação de entrada. O PHP consulta `tipo_usuario` no banco e recusa uma combinação de perfil incorreta.

## CADASTRO DE NOVOS USUÁRIOS

Para não permitir que qualquer visitante crie uma conta de Diretor ou Coordenador, o cadastro de usuários é administrativo:

1. Entre como **Coordenador** (`carolina.reis@emaii.edu.br`) ou Diretor.
2. Abra o menu **Usuários**.
3. Clique em **Cadastrar usuário**.
4. Informe nome, e-mail, senha inicial e perfil.
5. Para **Aluno**, informe também matrícula e turma.
6. Para **Professor**, selecione as turmas e disciplinas.
7. Para **Pai / Responsável**, selecione os alunos vinculados.
8. Clique em **Criar usuário**.

O backend cria, em uma única transação, o usuário de login e o registro relacionado em `alunos`, `professores` ou `responsaveis`. A senha é armazenada somente com `password_hash()`. E-mails e matrículas duplicados são recusados.

## ESTRUTURA DE PERMISSÕES

- **Diretor:** somente visão geral, turmas e comunicados; leitura dos indicadores institucionais.
- **Coordenador:** consulta administrativa, cadastro/edição de alunos e publicação de comunicados.
- **Professor:** consulta e lançamento de frequência, notas, atividades, ocorrências e observações somente nas turmas atribuídas ao próprio professor.
- **Aluno:** consulta somente seu próprio aluno, notas, frequência, atividades, comunicados e ocorrências.
- **Responsável:** consulta somente os alunos relacionados em `responsavel_alunos`.

A autorização é executada em `backend/api/index.php` e `backend/auth/auth.php`. Ocultar botões no frontend não é considerado segurança. IDs enviados pelo navegador são conferidos no banco antes de qualquer escrita.

## Fluxo de autenticação

1. O usuário escolhe o card e informa e-mail e senha.
2. `backend/api/index.php?action=login` busca o e-mail usando prepared statement.
3. O PHP verifica a senha com `password_verify()`.
4. O tipo armazenado no banco é comparado ao card escolhido.
5. A sessão é regenerada com `session_regenerate_id(true)`.
6. O backend retorna apenas dados públicos da sessão e o bootstrap filtrado por role.
7. Logout destrói a sessão no servidor e invalida o cookie.

## Endpoints principais

- `POST api/index.php?action=login`
- `POST api/index.php?action=logout`
- `GET api/index.php?action=session`
- `GET api/index.php?action=bootstrap`
- `POST api/index.php?action=add_student`
- `POST api/index.php?action=update_student`
- `POST api/index.php?action=add_announcement`
- `POST api/index.php?action=add_attendance`
- `POST api/index.php?action=add_grade`
- `POST api/index.php?action=add_activity`
- `POST api/index.php?action=add_occurrence`
- `POST api/index.php?action=add_observation`
- `POST api/index.php?action=chat`

Todos os endpoints protegidos exigem sessão PHP. As operações administrativas e de professor também exigem role e relacionamento com turma/aluno.

O código atual não contém upload de arquivos nem endpoint de upload.

## CHECKLIST FINAL

- [ ] Apache funcionando
- [ ] MySQL funcionando
- [ ] Banco `emaii` criado
- [ ] Tabelas criadas
- [ ] Usuários de teste criados
- [ ] Login de Diretor funcionando
- [ ] Login de Coordenador funcionando
- [ ] Login de Professor funcionando
- [ ] Login de Aluno funcionando
- [ ] Login de Responsável funcionando
- [ ] Perfil incorreto recusado
- [ ] Redirecionamento correto
- [ ] Sessão PHP funcionando
- [ ] Logout funcionando
- [ ] Páginas protegidas
- [ ] Permissões funcionando
- [ ] Aluno vendo somente seus dados
- [ ] Responsável vendo somente alunos vinculados
- [ ] Professor limitado às suas turmas
- [ ] Coordenador com suas permissões
- [ ] Diretor com sua visão geral
- [ ] Tentativa de voltar após logout bloqueada pelo bootstrap protegido

## Validação local feita

A sintaxe de todos os arquivos PHP criados/modificados e dos arquivos JavaScript integrados foi validada com `php -l` e `node --check`.
