/* ===== EMAII :: Dados iniciais (seed) ===== */
const SEED = {
  disciplinas: [
    { id: 'd1', nome: 'Desenvolvimento Web' },
    { id: 'd2', nome: 'Banco de Dados' },
    { id: 'd3', nome: 'Design de Interfaces' },
    { id: 'd4', nome: 'Matemática' },
    { id: 'd5', nome: 'Língua Portuguesa' },
  ],

  turmas: [
    { id: 't1', nome: 'TDSF1A', serie: '1º ano', turno: 'Manhã', alunoIds: ['a1', 'a2', 'a3'], professorIds: ['p1', 'p2'], disciplinaIds: ['d1', 'd2', 'd4'] },
    { id: 't2', nome: 'TDSF1B', serie: '1º ano', turno: 'Tarde', alunoIds: ['a4', 'a5', 'a6'], professorIds: ['p1', 'p3'], disciplinaIds: ['d1', 'd3', 'd5'] },
    { id: 't3', nome: 'TDSF2A', serie: '2º ano', turno: 'Manhã', alunoIds: ['a7'], professorIds: ['p2', 'p3'], disciplinaIds: ['d2', 'd3'] },
  ],

  alunos: [
    { id: 'a1', nome: 'Rafael Lima', matricula: '20241056', turmaId: 't1', dataNascimento: '2008-03-12', responsavelId: 'r1', situacao: 'Atenção', iniciais: 'RL', avatarCor: 'violet' },
    { id: 'a2', nome: 'Beatriz Alves', matricula: '20241057', turmaId: 't1', dataNascimento: '2008-06-02', responsavelId: 'r2', situacao: 'Regular', iniciais: 'BA', avatarCor: 'blue' },
    { id: 'a3', nome: 'Lucas Martins', matricula: '20241058', turmaId: 't1', dataNascimento: '2008-01-20', responsavelId: 'r3', situacao: 'Regular', iniciais: 'LM', avatarCor: 'amber' },
    { id: 'a4', nome: 'Ana Souza', matricula: '20241028', turmaId: 't2', dataNascimento: '2008-09-09', responsavelId: 'r4', situacao: 'Regular', iniciais: 'AS', avatarCor: 'rose' },
    { id: 'a5', nome: 'João Oliveira', matricula: '20241031', turmaId: 't2', dataNascimento: '2008-04-17', responsavelId: 'r5', situacao: 'Atenção', iniciais: 'JO', avatarCor: 'amber' },
    { id: 'a6', nome: 'Mariana Costa', matricula: '20241042', turmaId: 't2', dataNascimento: '2008-11-30', responsavelId: 'r6', situacao: 'Regular', iniciais: 'MC', avatarCor: 'blue' },
    { id: 'a7', nome: 'Pedro Santos', matricula: '20231012', turmaId: 't3', dataNascimento: '2007-07-07', responsavelId: 'r1', situacao: 'Em risco', iniciais: 'PS', avatarCor: 'red' },
  ],

  professores: [
    { id: 'p1', nome: 'Marcos Teixeira', email: 'marcos.teixeira@emaii.edu.br', disciplinaIds: ['d1'], turmaIds: ['t1', 't2'], iniciais: 'MT' },
    { id: 'p2', nome: 'Fernanda Rocha', email: 'fernanda.rocha@emaii.edu.br', disciplinaIds: ['d2'], turmaIds: ['t1', 't3'], iniciais: 'FR' },
    { id: 'p3', nome: 'Diego Nascimento', email: 'diego.nascimento@emaii.edu.br', disciplinaIds: ['d3', 'd5'], turmaIds: ['t2', 't3'], iniciais: 'DN' },
  ],

  responsaveis: [
    { id: 'r1', nome: 'Sandra Lima', email: 'sandra.lima@email.com', alunoIds: ['a1', 'a7'], iniciais: 'SL' },
    { id: 'r2', nome: 'Carlos Alves', email: 'carlos.alves@email.com', alunoIds: ['a2'], iniciais: 'CA' },
    { id: 'r3', nome: 'Patrícia Martins', email: 'patricia.martins@email.com', alunoIds: ['a3'], iniciais: 'PM' },
    { id: 'r4', nome: 'Roberto Souza', email: 'roberto.souza@email.com', alunoIds: ['a4'], iniciais: 'RS' },
    { id: 'r5', nome: 'Juliana Oliveira', email: 'juliana.oliveira@email.com', alunoIds: ['a5'], iniciais: 'JO' },
    { id: 'r6', nome: 'Eduardo Costa', email: 'eduardo.costa@email.com', alunoIds: ['a6'], iniciais: 'EC' },
  ],

  usuarios: [
    { id: 'u-diretor', nome: 'Antônio Ferreira', email: 'antonio.ferreira@emaii.edu.br', role: 'diretor', iniciais: 'AF', avatarCor: 'red' },
    { id: 'u-coord', nome: 'Carolina Reis', email: 'carolina.reis@emaii.edu.br', role: 'coordenador', iniciais: 'CR', avatarCor: 'red' },
    { id: 'u-p1', nome: 'Marcos Teixeira', email: 'marcos.teixeira@emaii.edu.br', role: 'professor', iniciais: 'MT', avatarCor: 'blue', turmaIds: ['t1', 't2'], disciplinas: ['d1'] },
    { id: 'u-p2', nome: 'Fernanda Rocha', email: 'fernanda.rocha@emaii.edu.br', role: 'professor', iniciais: 'FR', avatarCor: 'amber', turmaIds: ['t1', 't3'], disciplinas: ['d2'] },
    { id: 'u-a1', nome: 'Rafael Lima', email: 'rafael.lima@aluno.emaii.edu.br', role: 'aluno', iniciais: 'RL', avatarCor: 'violet', turmaId: 't1' },
    { id: 'u-a4', nome: 'Ana Souza', email: 'ana.souza@aluno.emaii.edu.br', role: 'aluno', iniciais: 'AS', avatarCor: 'rose', turmaId: 't2' },
    { id: 'u-r1', nome: 'Sandra Lima', email: 'sandra.lima@email.com', role: 'responsavel', iniciais: 'SL', avatarCor: 'red', alunoIds: ['a1', 'a7'] },
    { id: 'u-r4', nome: 'Roberto Souza', email: 'roberto.souza@email.com', role: 'responsavel', iniciais: 'RS', avatarCor: 'blue', alunoIds: ['a4'] },
  ],

  notas: [
    { id: 'n1', alunoId: 'a1', disciplinaId: 'd1', bimestre: 1, valor: 7.5, professorId: 'p1', data: '2026-04-10' },
    { id: 'n2', alunoId: 'a1', disciplinaId: 'd2', bimestre: 1, valor: 5.0, professorId: 'p2', data: '2026-04-12' },
    { id: 'n3', alunoId: 'a2', disciplinaId: 'd1', bimestre: 1, valor: 9.0, professorId: 'p1', data: '2026-04-10' },
    { id: 'n4', alunoId: 'a4', disciplinaId: 'd1', bimestre: 1, valor: 8.2, professorId: 'p1', data: '2026-04-11' },
    { id: 'n5', alunoId: 'a5', disciplinaId: 'd1', bimestre: 1, valor: 4.5, professorId: 'p1', data: '2026-04-11' },
  ],

  frequencias: [
    { id: 'f1', alunoId: 'a1', turmaId: 't1', disciplinaId: 'd1', data: '2026-09-22', status: 'falta', professorId: 'p1' },
    { id: 'f2', alunoId: 'a1', turmaId: 't1', disciplinaId: 'd1', data: '2026-09-23', status: 'presente', professorId: 'p1' },
    { id: 'f3', alunoId: 'a2', turmaId: 't1', disciplinaId: 'd1', data: '2026-09-23', status: 'presente', professorId: 'p1' },
    { id: 'f4', alunoId: 'a5', turmaId: 't2', disciplinaId: 'd1', data: '2026-09-23', status: 'falta_justificada', professorId: 'p1' },
  ],

  ocorrencias: [
    { id: 'o1', alunoId: 'a1', turmaId: 't1', tipo: 'Advertência', descricao: 'Uso de celular durante a aula sem autorização.', data: '2026-09-15', autorId: 'p1', autorNome: 'Marcos Teixeira' },
    { id: 'o2', alunoId: 'a5', turmaId: 't2', tipo: 'Observação', descricao: 'Dificuldade de concentração relatada pelo próprio aluno.', data: '2026-09-18', autorId: 'p1', autorNome: 'Marcos Teixeira' },
    { id: 'o3', alunoId: 'a2', turmaId: 't1', tipo: 'Elogio', descricao: 'Destaque em trabalho em grupo de Desenvolvimento Web.', data: '2026-09-20', autorId: 'p1', autorNome: 'Marcos Teixeira' },
  ],

  atividades: [
    { id: 'at1', turmaId: 't1', disciplinaId: 'd1', titulo: 'Projeto final — Aplicações Web', descricao: 'Desenvolver uma aplicação web completa em grupo.', dataEntrega: '2026-09-28', professorId: 'p1', criadaEm: '2026-09-01' },
    { id: 'at2', turmaId: 't1', disciplinaId: 'd2', titulo: 'Lista de exercícios 03', descricao: 'Exercícios de modelagem relacional.', dataEntrega: '2026-09-30', professorId: 'p2', criadaEm: '2026-09-10' },
    { id: 'at3', turmaId: 't2', disciplinaId: 'd3', titulo: 'Seminário de UX e acessibilidade', descricao: 'Apresentação em grupo sobre heurísticas de usabilidade.', dataEntrega: '2026-10-04', professorId: 'p3', criadaEm: '2026-09-12' },
  ],

  comunicados: [
    { id: 'c1', titulo: 'Reunião de pais e mestres', mensagem: 'Reunião geral marcada para o dia 30/09, às 19h, no auditório da escola.', data: '2026-09-20', autorId: 'u-coord', autorNome: 'Carolina Reis', destinatarios: 'todos' },
    { id: 'c2', titulo: 'Semana de provas', mensagem: 'A semana de avaliações bimestrais ocorrerá entre 06/10 e 10/10.', data: '2026-09-22', autorId: 'u-coord', autorNome: 'Carolina Reis', destinatarios: 'todos' },
  ],

  observacoes: [
    { id: 'ob1', alunoId: 'a1', turmaId: 't1', texto: 'Aluno demonstra bom raciocínio lógico, mas precisa melhorar a frequência.', data: '2026-09-16', professorId: 'p1', professorNome: 'Marcos Teixeira' },
  ],
}
