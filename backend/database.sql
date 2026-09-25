CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(50) PRIMARY KEY, nome VARCHAR(150) NOT NULL, email VARCHAR(190) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL, tipo_usuario ENUM('coordenador','diretor','aluno','professor','responsavel') NOT NULL,
  avatar_cor VARCHAR(20) NOT NULL DEFAULT 'red', iniciais VARCHAR(10) NOT NULL, professor_id VARCHAR(50) NULL,
  aluno_id VARCHAR(50) NULL, responsavel_id VARCHAR(50) NULL, ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS disciplinas (id VARCHAR(50) PRIMARY KEY, nome VARCHAR(150) NOT NULL UNIQUE) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS turmas (id VARCHAR(50) PRIMARY KEY, nome VARCHAR(100) NOT NULL, serie VARCHAR(60) NOT NULL, turno VARCHAR(30) NOT NULL) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS alunos (id VARCHAR(50) PRIMARY KEY, nome VARCHAR(150) NOT NULL, matricula VARCHAR(50) NOT NULL UNIQUE, turma_id VARCHAR(50) NOT NULL, data_nascimento DATE NULL, situacao VARCHAR(30) NOT NULL DEFAULT 'Regular', iniciais VARCHAR(10) NOT NULL, avatar_cor VARCHAR(20) NOT NULL DEFAULT 'blue') ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS professores (id VARCHAR(50) PRIMARY KEY, nome VARCHAR(150) NOT NULL, email VARCHAR(190) NOT NULL UNIQUE, iniciais VARCHAR(10) NOT NULL) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS responsaveis (id VARCHAR(50) PRIMARY KEY, nome VARCHAR(150) NOT NULL, email VARCHAR(190) NOT NULL UNIQUE, iniciais VARCHAR(10) NOT NULL) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS turma_disciplinas (turma_id VARCHAR(50) NOT NULL, disciplina_id VARCHAR(50) NOT NULL, PRIMARY KEY(turma_id,disciplina_id)) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS professor_turmas (professor_id VARCHAR(50) NOT NULL, turma_id VARCHAR(50) NOT NULL, PRIMARY KEY(professor_id,turma_id)) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS professor_disciplinas (professor_id VARCHAR(50) NOT NULL, disciplina_id VARCHAR(50) NOT NULL, PRIMARY KEY(professor_id,disciplina_id)) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS responsavel_alunos (responsavel_id VARCHAR(50) NOT NULL, aluno_id VARCHAR(50) NOT NULL, PRIMARY KEY(responsavel_id,aluno_id)) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS notas (id VARCHAR(50) PRIMARY KEY, aluno_id VARCHAR(50) NOT NULL, disciplina_id VARCHAR(50) NOT NULL, bimestre TINYINT NOT NULL, valor DECIMAL(4,2) NOT NULL, professor_id VARCHAR(50) NOT NULL, data_lancamento DATE NOT NULL) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS frequencias (id VARCHAR(50) PRIMARY KEY, aluno_id VARCHAR(50) NOT NULL, turma_id VARCHAR(50) NOT NULL, disciplina_id VARCHAR(50) NOT NULL, data DATE NOT NULL, status ENUM('presente','falta','falta_justificada') NOT NULL, professor_id VARCHAR(50) NOT NULL) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS ocorrencias (id VARCHAR(50) PRIMARY KEY, aluno_id VARCHAR(50) NOT NULL, turma_id VARCHAR(50) NOT NULL, tipo VARCHAR(40) NOT NULL, descricao TEXT NOT NULL, data DATE NOT NULL, autor_id VARCHAR(50) NOT NULL, autor_nome VARCHAR(150) NOT NULL) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS atividades (id VARCHAR(50) PRIMARY KEY, turma_id VARCHAR(50) NOT NULL, disciplina_id VARCHAR(50) NOT NULL, titulo VARCHAR(150) NOT NULL, descricao TEXT NOT NULL, data_entrega DATE NULL, professor_id VARCHAR(50) NOT NULL, criada_em DATE NOT NULL) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS comunicados (id VARCHAR(50) PRIMARY KEY, titulo VARCHAR(150) NOT NULL, mensagem TEXT NOT NULL, data DATE NOT NULL, autor_id VARCHAR(50) NOT NULL, autor_nome VARCHAR(150) NOT NULL, destinatarios VARCHAR(30) NOT NULL DEFAULT 'todos') ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS observacoes (id VARCHAR(50) PRIMARY KEY, aluno_id VARCHAR(50) NOT NULL, turma_id VARCHAR(50) NOT NULL, texto TEXT NOT NULL, data DATE NOT NULL, professor_id VARCHAR(50) NOT NULL, professor_nome VARCHAR(150) NOT NULL) ENGINE=InnoDB;

INSERT IGNORE INTO disciplinas VALUES ('d1','Desenvolvimento Web'),('d2','Banco de Dados'),('d3','Design de Interfaces'),('d4','Matemática'),('d5','Língua Portuguesa');
INSERT IGNORE INTO turmas VALUES ('t1','TDSF1A','1º ano','Manhã'),('t2','TDSF1B','1º ano','Tarde'),('t3','TDSF2A','2º ano','Manhã');
INSERT IGNORE INTO alunos VALUES
('a1','Rafael Lima','20241056','t1','2008-03-12','Atenção','RL','violet'),('a2','Beatriz Alves','20241057','t1','2008-06-02','Regular','BA','blue'),('a3','Lucas Martins','20241058','t1','2008-01-20','Regular','LM','amber'),('a4','Ana Souza','20241028','t2','2008-09-09','Regular','AS','rose'),('a5','João Oliveira','20241031','t2','2008-04-17','Atenção','JO','amber'),('a6','Mariana Costa','20241042','t2','2008-11-30','Regular','MC','blue'),('a7','Pedro Santos','20231012','t3','2007-07-07','Em risco','PS','red');
INSERT IGNORE INTO professores VALUES ('p1','Marcos Teixeira','marcos.teixeira@emaii.edu.br','MT'),('p2','Fernanda Rocha','fernanda.rocha@emaii.edu.br','FR'),('p3','Diego Nascimento','diego.nascimento@emaii.edu.br','DN');
INSERT IGNORE INTO responsaveis VALUES ('r1','Sandra Lima','sandra.lima@email.com','SL'),('r2','Carlos Alves','carlos.alves@email.com','CA'),('r3','Patrícia Martins','patricia.martins@email.com','PM'),('r4','Roberto Souza','roberto.souza@email.com','RS'),('r5','Juliana Oliveira','juliana.oliveira@email.com','JO'),('r6','Eduardo Costa','eduardo.costa@email.com','EC');
INSERT IGNORE INTO turma_disciplinas VALUES ('t1','d1'),('t1','d2'),('t1','d4'),('t2','d1'),('t2','d3'),('t2','d5'),('t3','d2'),('t3','d3');
INSERT IGNORE INTO professor_turmas VALUES ('p1','t1'),('p1','t2'),('p2','t1'),('p2','t3'),('p3','t2'),('p3','t3');
INSERT IGNORE INTO professor_disciplinas VALUES ('p1','d1'),('p2','d2'),('p3','d3'),('p3','d5');
INSERT IGNORE INTO responsavel_alunos VALUES ('r1','a1'),('r1','a7'),('r2','a2'),('r3','a3'),('r4','a4'),('r5','a5'),('r6','a6');
INSERT IGNORE INTO usuarios (id,nome,email,senha,tipo_usuario,avatar_cor,iniciais,professor_id,aluno_id,responsavel_id) VALUES
('u-diretor','Antônio Ferreira','antonio.ferreira@emaii.edu.br','$2y$10$6/6D9oaCphVoV7AEmzvCXO9bvdIu2qTHweE/rW9JcBm45yxnG3jHm','diretor','red','AF',NULL,NULL,NULL),
('u-coord','Carolina Reis','carolina.reis@emaii.edu.br','$2y$10$6/6D9oaCphVoV7AEmzvCXO9bvdIu2qTHweE/rW9JcBm45yxnG3jHm','coordenador','red','CR',NULL,NULL,NULL),
('u-p1','Marcos Teixeira','marcos.teixeira@emaii.edu.br','$2y$10$6/6D9oaCphVoV7AEmzvCXO9bvdIu2qTHweE/rW9JcBm45yxnG3jHm','professor','blue','MT','p1',NULL,NULL),
('u-a1','Rafael Lima','rafael.lima@aluno.emaii.edu.br','$2y$10$6/6D9oaCphVoV7AEmzvCXO9bvdIu2qTHweE/rW9JcBm45yxnG3jHm','aluno','violet','RL',NULL,'a1',NULL),
('u-r1','Sandra Lima','sandra.lima@email.com','$2y$10$6/6D9oaCphVoV7AEmzvCXO9bvdIu2qTHweE/rW9JcBm45yxnG3jHm','responsavel','red','SL',NULL,NULL,'r1');
INSERT IGNORE INTO notas VALUES ('n1','a1','d1',1,7.5,'p1','2026-04-10'),('n2','a1','d2',1,5.0,'p2','2026-04-12'),('n3','a2','d1',1,9.0,'p1','2026-04-10'),('n4','a4','d1',1,8.2,'p1','2026-04-11'),('n5','a5','d1',1,4.5,'p1','2026-04-11');
INSERT IGNORE INTO frequencias VALUES ('f1','a1','t1','d1','2026-09-22','falta','p1'),('f2','a1','t1','d1','2026-09-23','presente','p1'),('f3','a2','t1','d1','2026-09-23','presente','p1'),('f4','a5','t2','d1','2026-09-23','falta_justificada','p1');
INSERT IGNORE INTO ocorrencias VALUES ('o1','a1','t1','Advertência','Uso de celular durante a aula sem autorização.','2026-09-15','u-p1','Marcos Teixeira'),('o2','a5','t2','Observação','Dificuldade de concentração relatada pelo próprio aluno.','2026-09-18','u-p1','Marcos Teixeira'),('o3','a2','t1','Elogio','Destaque em trabalho em grupo de Desenvolvimento Web.','2026-09-20','u-p1','Marcos Teixeira');
INSERT IGNORE INTO atividades VALUES ('at1','t1','d1','Projeto final — Aplicações Web','Desenvolver uma aplicação web completa em grupo.','2026-09-28','p1','2026-09-01'),('at2','t1','d2','Lista de exercícios 03','Exercícios de modelagem relacional.','2026-09-30','p2','2026-09-10'),('at3','t2','d3','Seminário de UX e acessibilidade','Apresentação em grupo sobre heurísticas de usabilidade.','2026-10-04','p3','2026-09-12');
INSERT IGNORE INTO comunicados VALUES ('c1','Reunião de pais e mestres','Reunião geral marcada para o dia 30/09, às 19h, no auditório da escola.','2026-09-20','u-coord','Carolina Reis','todos'),('c2','Semana de provas','A semana de avaliações bimestrais ocorrerá entre 06/10 e 10/10.','2026-09-22','u-coord','Carolina Reis','todos');
INSERT IGNORE INTO observacoes VALUES ('ob1','a1','t1','Aluno demonstra bom raciocínio lógico, mas precisa melhorar a frequência.','2026-09-16','p1','Marcos Teixeira');
