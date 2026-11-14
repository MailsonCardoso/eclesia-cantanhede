import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Camada de dados local (demonstração). Cada coleção espelha um recurso REST
 * que é servido pela API Laravel (ex.: GET/POST/PUT/DELETE /api/members).
 */

type V = string | number | boolean | object | undefined | null;
export type Row = {
  id: string;
  nome?: V;
  name?: V;
  titulo?: V;
  title?: V;
  descricao?: V;
  description?: V;
  membro?: V;
  categoria?: V;
  category?: V;
  congregacao?: V;
  data?: V;
  date?: V;
  local?: V;
  location?: V;
  nascimento?: V;
  birth_date?: V;
  batismo?: V;
  baptism_date?: V;
  sexo?: V;
  sex?: V;
  estadoCivil?: V;
  estado_civil?: V;
  marital_status?: V;
  telefone?: V;
  phone?: V;
  email?: V;
  pagamento?: V;
  recebimento?: V;
  situacao?: V;
  status?: V;
  tipo?: V;
  type?: V;
  valor?: V;
  total?: V;
  completed?: V;
  color?: V;
  cover_color?: V;
  series?: V;
  series_id?: V;
  verse?: V;
  reference?: V;
  content?: V;
  tags?: V;
  sermon_id?: V;
  person?: V;
  member_id?: V;
  reason?: V;
  notes?: V;
  requested_at?: V;
  cell_id?: V;
  father_id?: V;
  mother_id?: V;
  spouse_id?: V;
  father_name?: V;
  mother_name?: V;
  spouse_name?: V;
  cep?: V;
  logradouro?: V;
  bairro?: V;
  cidade?: V;
  uf?: V;
  [k: string]: V;
};

export type Collection =
  | "members"
  | "congregations"
  | "departments"
  | "cells"
  | "transactions"
  | "contributions"
  | "events"
  | "appointments"
  | "inventory"
  | "pastor_series"
  | "pastor_sermons"
  | "pastor_insights"
  | "pastoral_requests";

export type AuditEntry = {
  id: string;
  at: string;
  collection: Collection;
  action: "criação" | "edição" | "exclusão";
  label: string;
};

type DB = Record<Collection, Row[]> & { audit: AuditEntry[] };

const uid = () => Math.random().toString(36).slice(2, 10);
const d = (offsetDays: number) => {
  const x = new Date();
  x.setDate(x.getDate() + offsetDays);
  return x.toISOString().slice(0, 10);
};
const ageYears = (years: number, month = 5, day = 15) => {
  const x = new Date();
  x.setFullYear(x.getFullYear() - years);
  x.setMonth(month - 1);
  x.setDate(day);
  return x.toISOString().slice(0, 10);
};

const congs = ["Sede Central", "Congregação Vila Nova", "Congregação Jardim Esperança"];
const cellNames = ["Célula Ágape", "Célula Betel", "Célula Canaã", "Célula Emanuel", "Célula Shalom"];

export function seed(): DB {
  // 1. Membros com auto-relacionamento familiar realista
  const members: Row[] = [
    // Casal 1: Carlos & Ana
    {
      id: "m_carlos",
      nome: "Carlos Eduardo Lima",
      name: "Carlos Eduardo Lima",
      cpf: "101.201.301-11",
      nascimento: ageYears(42, 3, 10),
      sexo: "Masculino",
      sex: "Masculino",
      estadoCivil: "Casado(a)",
      marital_status: "Casado(a)",
      telefone: "(11) 98111-2233",
      phone: "(11) 98111-2233",
      email: "carlos.lima@email.com",
      endereco: "Rua das Oliveiras, 120",
      logradouro: "Rua das Oliveiras, 120",
      bairro: "Centro",
      cidade: "Cantanhede",
      uf: "MA",
      cep: "65465-000",
      batismo: "2010-04-12",
      recebimento: d(-1200),
      situacao: "Ativo",
      status: "Ativo",
      tipo: "Membro",
      category: "Membro",
      congregacao: congs[0],
      departamento: "Homens",
      cargo: "Presbítero",
      role: "Presbítero",
      celula: cellNames[0],
      spouse_id: "m_ana",
      spouse_name: "Ana Beatriz Souza",
      conjuge: "Ana Beatriz Souza",
      filhos: "Davi Souza Lima, Ester Lima",
      observacoes: "Líder de célula",
    },
    {
      id: "m_ana",
      nome: "Ana Beatriz Souza",
      name: "Ana Beatriz Souza",
      cpf: "102.202.302-22",
      nascimento: ageYears(39, 7, 22),
      sexo: "Feminino",
      sex: "Feminino",
      estadoCivil: "Casado(a)",
      marital_status: "Casado(a)",
      telefone: "(11) 98111-2244",
      phone: "(11) 98111-2244",
      email: "ana.souza@email.com",
      endereco: "Rua das Oliveiras, 120",
      logradouro: "Rua das Oliveiras, 120",
      bairro: "Centro",
      cidade: "Cantanhede",
      uf: "MA",
      cep: "65465-000",
      batismo: "2012-08-15",
      recebimento: d(-1100),
      situacao: "Ativo",
      status: "Ativo",
      tipo: "Membro",
      category: "Membro",
      congregacao: congs[0],
      departamento: "Mulheres",
      cargo: "Diaconisa",
      role: "Diaconisa",
      celula: cellNames[0],
      spouse_id: "m_carlos",
      spouse_name: "Carlos Eduardo Lima",
      conjuge: "Carlos Eduardo Lima",
      filhos: "Davi Souza Lima, Ester Lima",
      observacoes: "Coordenadora da EBD infantil",
    },
    // Filhos do Casal 1
    {
      id: "m_davi",
      nome: "Davi Souza Lima",
      name: "Davi Souza Lima",
      nascimento: ageYears(8, 2, 14),
      sexo: "Masculino",
      sex: "Masculino",
      estadoCivil: "Solteiro(a)",
      marital_status: "Solteiro(a)",
      telefone: "(11) 98111-2233",
      phone: "(11) 98111-2233",
      email: "",
      endereco: "Rua das Oliveiras, 120",
      situacao: "Ativo",
      status: "Ativo",
      tipo: "Congregado",
      category: "Congregado",
      congregacao: congs[0],
      departamento: "Crianças",
      cargo: "Membro Infantil",
      father_id: "m_carlos",
      father_name: "Carlos Eduardo Lima",
      pai: "Carlos Eduardo Lima",
      mother_id: "m_ana",
      mother_name: "Ana Beatriz Souza",
      mae: "Ana Beatriz Souza",
      observacoes: "Turma Primários da EBD",
    },
    {
      id: "m_ester",
      nome: "Ester Lima",
      name: "Ester Lima",
      nascimento: ageYears(16, 11, 5),
      sexo: "Feminino",
      sex: "Feminino",
      estadoCivil: "Solteiro(a)",
      marital_status: "Solteiro(a)",
      telefone: "(11) 98111-5566",
      phone: "(11) 98111-5566",
      email: "ester.lima@email.com",
      endereco: "Rua das Oliveiras, 120",
      batismo: "2024-03-10",
      situacao: "Ativo",
      status: "Ativo",
      tipo: "Membro",
      category: "Membro",
      congregacao: congs[0],
      departamento: "Adolescentes",
      cargo: "Membro",
      father_id: "m_carlos",
      father_name: "Carlos Eduardo Lima",
      pai: "Carlos Eduardo Lima",
      mother_id: "m_ana",
      mother_name: "Ana Beatriz Souza",
      mae: "Ana Beatriz Souza",
      observacoes: "Louvor teen",
    },

    // Casal 2: Elias & Débora
    {
      id: "m_elias",
      nome: "Elias Martins",
      name: "Elias Martins",
      cpf: "103.203.303-33",
      nascimento: ageYears(48, 6, 18),
      sexo: "Masculino",
      sex: "Masculino",
      estadoCivil: "Casado(a)",
      marital_status: "Casado(a)",
      telefone: "(11) 98222-3344",
      phone: "(11) 98222-3344",
      email: "elias.martins@email.com",
      endereco: "Av. Brasil, 450",
      batismo: "2005-11-20",
      situacao: "Ativo",
      status: "Ativo",
      tipo: "Membro",
      congregacao: congs[1],
      departamento: "Homens",
      cargo: "Pastor Auxiliar",
      spouse_id: "m_debora",
      spouse_name: "Débora Ferreira",
      conjuge: "Débora Ferreira",
      filhos: "Samuel Martins Ferreira, Matheus Martins",
    },
    {
      id: "m_debora",
      nome: "Débora Ferreira",
      name: "Débora Ferreira",
      cpf: "104.204.304-44",
      nascimento: ageYears(45, 9, 30),
      sexo: "Feminino",
      sex: "Feminino",
      estadoCivil: "Casado(a)",
      marital_status: "Casado(a)",
      telefone: "(11) 98222-3355",
      phone: "(11) 98222-3355",
      email: "debora.ferreira@email.com",
      endereco: "Av. Brasil, 450",
      batismo: "2006-04-16",
      situacao: "Ativo",
      status: "Ativo",
      tipo: "Membro",
      congregacao: congs[1],
      departamento: "Mulheres",
      cargo: "Líder de Ministério",
      spouse_id: "m_elias",
      spouse_name: "Elias Martins",
      conjuge: "Elias Martins",
      filhos: "Samuel Martins Ferreira, Matheus Martins",
    },
    {
      id: "m_samuel_jr",
      nome: "Samuel Martins Ferreira",
      name: "Samuel Martins Ferreira",
      nascimento: ageYears(5, 4, 12),
      sexo: "Masculino",
      sex: "Masculino",
      estadoCivil: "Solteiro(a)",
      telefone: "(11) 98222-3344",
      endereco: "Av. Brasil, 450",
      situacao: "Ativo",
      tipo: "Congregado",
      congregacao: congs[1],
      departamento: "Crianças",
      father_id: "m_elias",
      father_name: "Elias Martins",
      pai: "Elias Martins",
      mother_id: "m_debora",
      mother_name: "Débora Ferreira",
      mae: "Débora Ferreira",
      observacoes: "Maternal EBD",
    },
    {
      id: "m_matheus",
      nome: "Matheus Martins",
      name: "Matheus Martins",
      nascimento: ageYears(15, 8, 20),
      sexo: "Masculino",
      sex: "Masculino",
      estadoCivil: "Solteiro(a)",
      telefone: "(11) 98222-8899",
      endereco: "Av. Brasil, 450",
      situacao: "Ativo",
      tipo: "Membro",
      congregacao: congs[1],
      departamento: "Adolescentes",
      father_id: "m_elias",
      father_name: "Elias Martins",
      pai: "Elias Martins",
      mother_id: "m_debora",
      mother_name: "Débora Ferreira",
      mae: "Débora Ferreira",
    },

    // Casal 3: Gabriel & Fernanda
    {
      id: "m_gabriel",
      nome: "Gabriel Almeida",
      name: "Gabriel Almeida",
      cpf: "105.205.305-55",
      nascimento: ageYears(34, 1, 15),
      sexo: "Masculino",
      sex: "Masculino",
      estadoCivil: "Casado(a)",
      telefone: "(11) 98333-4455",
      email: "gabriel.almeida@email.com",
      endereco: "Rua Primavera, 85",
      batismo: "2015-10-18",
      situacao: "Ativo",
      tipo: "Membro",
      congregacao: congs[2],
      departamento: "Jovens",
      cargo: "Líder de Jovens",
      spouse_id: "m_fernanda",
      spouse_name: "Fernanda Rocha",
      conjuge: "Fernanda Rocha",
      filhos: "Laura Rocha Almeida",
    },
    {
      id: "m_fernanda",
      nome: "Fernanda Rocha",
      name: "Fernanda Rocha",
      cpf: "106.206.306-66",
      nascimento: ageYears(32, 12, 3),
      sexo: "Feminino",
      sex: "Feminino",
      estadoCivil: "Casado(a)",
      telefone: "(11) 98333-4466",
      email: "fernanda.rocha@email.com",
      endereco: "Rua Primavera, 85",
      batismo: "2016-03-27",
      situacao: "Ativo",
      tipo: "Membro",
      congregacao: congs[2],
      departamento: "Louvor",
      cargo: "Ministra de Louvor",
      spouse_id: "m_gabriel",
      spouse_name: "Gabriel Almeida",
      conjuge: "Gabriel Almeida",
      filhos: "Laura Rocha Almeida",
    },
    {
      id: "m_laura",
      nome: "Laura Rocha Almeida",
      name: "Laura Rocha Almeida",
      nascimento: ageYears(11, 10, 25),
      sexo: "Feminino",
      sex: "Feminino",
      estadoCivil: "Solteiro(a)",
      telefone: "(11) 98333-4455",
      endereco: "Rua Primavera, 85",
      situacao: "Ativo",
      tipo: "Congregado",
      congregacao: congs[2],
      departamento: "Crianças",
      father_id: "m_gabriel",
      father_name: "Gabriel Almeida",
      pai: "Gabriel Almeida",
      mother_id: "m_fernanda",
      mother_name: "Fernanda Rocha",
      mae: "Fernanda Rocha",
      observacoes: "Juniores EBD",
    },

    // Membros Solteiros e Outros
    {
      id: "m_lucas",
      nome: "Lucas Barbosa",
      name: "Lucas Barbosa",
      cpf: "107.207.307-77",
      nascimento: ageYears(27, 5, 8),
      sexo: "Masculino",
      sex: "Masculino",
      estadoCivil: "Solteiro(a)",
      telefone: "(11) 98444-5566",
      email: "lucas.barbosa@email.com",
      endereco: "Rua das Flores, 210",
      batismo: "2018-07-22",
      situacao: "Ativo",
      tipo: "Membro",
      congregacao: congs[0],
      departamento: "Louvor",
      cargo: "Músico",
    },
    {
      id: "m_priscila",
      nome: "Priscila Santos",
      name: "Priscila Santos",
      cpf: "108.208.308-88",
      nascimento: ageYears(25, 9, 14),
      sexo: "Feminino",
      sex: "Feminino",
      estadoCivil: "Solteiro(a)",
      telefone: "(11) 98555-6677",
      email: "priscila.santos@email.com",
      endereco: "Rua Central, 500",
      batismo: "2019-11-10",
      situacao: "Ativo",
      tipo: "Membro",
      congregacao: congs[0],
      departamento: "Jovens",
      cargo: "Líder de Acolhimento",
    },
    {
      id: "m_tiago",
      nome: "Tiago Nunes",
      name: "Tiago Nunes",
      cpf: "109.209.309-99",
      nascimento: ageYears(62, 2, 28),
      sexo: "Masculino",
      sex: "Masculino",
      estadoCivil: "Viúvo(a)",
      telefone: "(11) 98666-7788",
      email: "tiago.nunes@email.com",
      endereco: "Av. dos Ipês, 78",
      batismo: "1995-09-17",
      situacao: "Ativo",
      tipo: "Membro",
      congregacao: congs[1],
      departamento: "Intercessão",
      cargo: "Diácono",
    },
    {
      id: "m_marta",
      nome: "Marta Oliveira",
      name: "Marta Oliveira",
      cpf: "110.210.310-00",
      nascimento: ageYears(58, 11, 19),
      sexo: "Feminino",
      sex: "Feminino",
      estadoCivil: "Viúvo(a)",
      telefone: "(11) 98777-8899",
      email: "marta.oliveira@email.com",
      endereco: "Rua Bela Vista, 312",
      batismo: "1998-05-24",
      situacao: "Ativo",
      tipo: "Membro",
      congregacao: congs[0],
      departamento: "Ação Social",
      cargo: "Coordenadora Social",
    },
  ];

  // 2. Séries de Mensagens Pastorais
  const pastor_series: Row[] = [
    {
      id: "s_romanos",
      title: "Estudos em Romanos",
      titulo: "Estudos em Romanos",
      description: "Série expositiva sobre a justificação pela fé, segurança da salvação e o triunfo da graça.",
      descricao: "Série expositiva sobre a justificação pela fé, segurança da salvação e o triunfo da graça.",
      total: 8,
      completed: 3,
      color: "bg-blue-500",
      cover_color: "from-blue-600/30 via-indigo-600/15 to-transparent",
      start_date: d(-45),
      data: d(-45),
    },
    {
      id: "s_familias",
      title: "Famílias Fortes no Altar",
      titulo: "Famílias Fortes no Altar",
      description: "Princípios bíblicos para o casamento cristão, criação de filhos e edificação do altar doméstico.",
      descricao: "Princípios bíblicos para o casamento cristão, criação de filhos e edificação do altar doméstico.",
      total: 6,
      completed: 4,
      color: "bg-emerald-500",
      cover_color: "from-emerald-600/30 via-teal-600/15 to-transparent",
      start_date: d(-25),
      data: d(-25),
    },
    {
      id: "s_esperanca",
      title: "Âncora da Alma",
      titulo: "Âncora da Alma",
      description: "Mensagens de consolo, fé e perseverança em tempos de incerteza baseadas na Carta aos Hebreus.",
      descricao: "Mensagens de consolo, fé e perseverança em tempos de incerteza baseadas na Carta aos Hebreus.",
      total: 4,
      completed: 1,
      color: "bg-amber-500",
      cover_color: "from-amber-600/30 via-orange-600/15 to-transparent",
      start_date: d(-10),
      data: d(-10),
    },
  ];

  // 3. Sermões / Esboços com JSON Estruturado
  const pastor_sermons: Row[] = [
    {
      id: "srm_1",
      title: "A Justificação pela Fé e a Paz com Deus",
      titulo: "A Justificação pela Fé e a Paz com Deus",
      series: "Estudos em Romanos",
      series_id: "s_romanos",
      verse: "Romanos 5:1-5",
      date: d(-30),
      data: d(-30),
      status: "Pregado",
      color: "bg-blue-500",
      content: {
        intro: "O apóstolo Paulo estabelece a certeza inabalável da nossa reconciliação com o Pai através do sacrifício de Cristo...",
        topics: [
          "1. Tendo sido justificados pela fé, desfrutamos da verdadeira paz com Deus.",
          "2. Temos livre acesso a esta graça na qual estamos firmados e nos gloriamos na esperança.",
          "3. A perseverança nas tribulações produz um caráter aprovado e uma esperança que nunca decepciona.",
        ],
        conclusion: "Descanse na paz comprada na cruz. Viva hoje sem a condenação do passado e com a certeza da vitória futura.",
      },
    },
    {
      id: "srm_2",
      title: "Mais que Vencedores em Cristo",
      titulo: "Mais que Vencedores em Cristo",
      series: "Estudos em Romanos",
      series_id: "s_romanos",
      verse: "Romanos 8:31-39",
      date: d(-15),
      data: d(-15),
      status: "Pregado",
      color: "bg-blue-500",
      content: {
        intro: "Diante de todos os desafios da vida, a pergunta crucial é: se Deus é por nós, quem poderá ser contra nós?",
        topics: [
          "1. Aquele que não poupou Seu próprio Filho nos dará juntamente com Ele todas as coisas.",
          "2. Quem intentará acusação contra os eleitos de Deus? É Cristo quem nos justifica e intercede por nós.",
          "3. Nem morte, nem vida, nem anjos nem principados podem nos separar do amor de Deus.",
        ],
        conclusion: "Em todas as batalhas você não é apenas sobrevivente; em Cristo você é mais do que vencedor.",
      },
    },
    {
      id: "srm_3",
      title: "O Casamento Segundo o Padrão do Éden",
      titulo: "O Casamento Segundo o Padrão do Éden",
      series: "Famílias Fortes no Altar",
      series_id: "s_familias",
      verse: "Efésios 5:21-33",
      date: d(-7),
      data: d(-7),
      status: "Pregado",
      color: "bg-emerald-500",
      content: {
        intro: "O casamento é a instituição terrena que melhor retrata o amor sacrificial de Cristo por Sua amada Noiva...",
        topics: [
          "1. Submissão mútua fundamentada no temor sincero a Cristo.",
          "2. O amor protetor, perdoador e sacrificial do esposo como cabeça do lar.",
          "3. A honra, a cooperação e o cuidado mútuo na rotina diária da casa.",
        ],
        conclusion: "Orem juntos nesta noite, renovem o carinho e façam da sua casa um pedaço do céu na terra.",
      },
    },
    {
      id: "srm_4",
      title: "Cuidando da Próxima Geração",
      titulo: "Cuidando da Próxima Geração",
      series: "Famílias Fortes no Altar",
      series_id: "s_familias",
      verse: "Deuteronômio 6:4-9",
      date: d(3),
      data: d(3),
      status: "Planejado",
      color: "bg-emerald-500",
      content: {
        intro: "A fé bíblica não é transmitida por herança genética, mas sim pelo testemunho intencional de pais consagrados...",
        topics: [
          "1. Amar ao Senhor de todo o coração antes de exigir dos filhos.",
          "2. Ensinar os princípios divinos ao sentar na mesa, ao andar pelo caminho e ao levantar.",
          "3. Proteger a mente das crianças contra os ataques e distrações da cultura mundana.",
        ],
        conclusion: "Assuma o compromisso de restabelecer o culto doméstico e ministrar a bênção sobre seus filhos todos os dias.",
      },
    },
    {
      id: "srm_5",
      title: "Firmeza em Meio à Tempestade",
      titulo: "Firmeza em Meio à Tempestade",
      series: "Âncora da Alma",
      series_id: "s_esperanca",
      verse: "Hebreus 6:17-20",
      date: d(7),
      data: d(7),
      status: "Planejado",
      color: "bg-amber-500",
      content: {
        intro: "Quando as circunstâncias ao nosso redor estremecem, temos uma âncora firme e segura penetrando além do véu...",
        topics: [
          "1. A imutabilidade do conselho e das promessas divinas.",
          "2. A esperança colocada diante de nós como refúgio seguro nas aflições.",
          "3. Jesus entrou por nós como eterno Sumo Sacerdote e guardião da nossa vida.",
        ],
        conclusion: "Não olhe para a fúria das ondas; olhe para a solidez da rocha onde a sua âncora está cravada.",
      },
    },
    {
      id: "srm_6",
      title: "A Oração Fervorosa que Move Céus",
      titulo: "A Oração Fervorosa que Move Céus",
      series: "Avulso",
      series_id: "",
      verse: "Tiago 5:13-18",
      date: d(14),
      data: d(14),
      status: "Rascunho",
      color: "bg-purple-500",
      content: {
        intro: "Muitos oram sem expectativa, mas a Escritura nos ensina que a súplica do justo tem poder inestimável em seus efeitos...",
        topics: [
          "1. Orar nas aflições e cantar louvores nas alegrias.",
          "2. A confissão de pecados e a intercessão mútua geram cura no corpo.",
          "3. Elias era homem sujeito às mesmas fraquezas que nós, e sua oração mudou a história de uma nação.",
        ],
        conclusion: "Dedique hoje um tempo de qualidade a sós com o Pai; os maiores milagres começam de joelhos.",
      },
    },
  ];

  // 4. Insights Teológicos
  const pastor_insights: Row[] = [
    {
      id: "ins_1",
      type: "verse",
      tipo: "verse",
      title: "Promessa de Paz Incondicional",
      titulo: "Promessa de Paz Incondicional",
      reference: "João 14:27",
      content: "Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize.",
      tags: ["paz", "consolo", "fé", "romanos"],
      sermon_id: "srm_1",
    },
    {
      id: "ins_2",
      type: "quote",
      tipo: "quote",
      title: "C.S. Lewis sobre a Dor",
      titulo: "C.S. Lewis sobre a Dor",
      reference: "O Problema do Sofrimento (pág. 93)",
      content: "Deus sussurra em nossos prazeres, fala em nossa consciência, mas grita em nossas dores: é o megafone para despertar um mundo surdo.",
      tags: ["sofrimento", "dor", "fé", "esperança"],
      sermon_id: "srm_5",
    },
    {
      id: "ins_3",
      type: "illustration",
      tipo: "illustration",
      title: "A Âncora nas Pedras Submersas",
      titulo: "A Âncora nas Pedras Submersas",
      reference: "Tradição Marítima e Arqueologia Bíblica",
      content: "Nas tempestades do mar Egeu, marinheiros lançavam a âncora 'além das arrebentações' para segurar a proa do navio na direção das ondas até o romper da aurora.",
      tags: ["ilustração", "esperança", "mar", "tempestade"],
      sermon_id: "srm_5",
    },
    {
      id: "ins_4",
      type: "note",
      tipo: "note",
      title: "Exegese do Grego: Sunergei",
      titulo: "Exegese do Grego: Sunergei",
      reference: "Rm 8:28 — Léxico Thayer",
      content: "O verbo 'sunergei' (cooperar) demonstra que Deus não é autor do mal, mas orquestra e harmoniza todas as circunstâncias em favor dos que O amam.",
      tags: ["exegese", "romanos", "soberania", "graça"],
      sermon_id: "srm_2",
    },
    {
      id: "ins_5",
      type: "quote",
      tipo: "quote",
      title: "Spurgeon sobre a Oração Eficaz",
      titulo: "Spurgeon sobre a Oração Eficaz",
      reference: "Sermões no Tabernáculo Metropolitano",
      content: "A oração é o nervo que move os músculos da onipotência divina. Nenhum crente é maior do que a sua vida secreta de oração.",
      tags: ["oração", "poder", "igreja", "avivamento"],
      sermon_id: "srm_6",
    },
  ];

  // 5. Solicitações de Gabinete e Visitas
  const pastoral_requests: Row[] = [
    {
      id: "req_1",
      person: "Ana Beatriz Souza",
      membro: "Ana Beatriz Souza",
      member_id: "m_ana",
      type: "Gabinete",
      tipo: "Gabinete",
      reason: "Orientação sobre liderança da célula e transição de carreira profissional.",
      notes: "Prefere horário noturno às terças ou quartas.",
      requested_at: d(-2) + " 14:30:00",
      data: d(-2),
      status: "Pendente",
      situacao: "Pendente",
    },
    {
      id: "req_2",
      person: "Carlos Eduardo Lima",
      membro: "Carlos Eduardo Lima",
      member_id: "m_carlos",
      type: "Visita",
      tipo: "Visita",
      reason: "Oração pela recuperação da mãe que passou por cirurgia recente.",
      notes: "Residência familiar ou Hospital Regional.",
      requested_at: d(-1) + " 09:15:00",
      data: d(-1),
      status: "Pendente",
      situacao: "Pendente",
    },
    {
      id: "req_3",
      person: "Priscila Santos",
      membro: "Priscila Santos",
      member_id: "m_priscila",
      type: "Gabinete",
      tipo: "Gabinete",
      reason: "Aconselhamento pré-nupcial e dúvidas sobre planejamento familiar.",
      notes: "Agendamento confirmado para esta semana.",
      requested_at: d(-5) + " 11:00:00",
      data: d(-5),
      status: "Agendado",
      situacao: "Agendado",
    },
  ];

  // 6. Coleções padrão existentes mantidas
  const congregations: Row[] = congs.map((c, i) => ({
    id: uid(),
    nome: c,
    cnpj: i === 0 ? "12.345.678/0001-90" : "",
    endereco: `Av. Principal, ${500 + i * 120}`,
    telefone: `(11) 3${300 + i}-4${100 + i}`,
    pastor: ["Pr. João Silva", "Pr. Marcos Reis", "Pr. André Luz"][i],
    fundacao: `19${88 + i * 5}-03-15`,
    situacao: "Ativa",
  }));

  const deps = ["Louvor", "Jovens", "Crianças", "Adolescentes", "Mulheres", "Homens", "Intercessão", "Evangelismo", "Ação Social", "Escola Bíblica Dominical"];
  const departments: Row[] = deps.map((n, i) => ({
    id: uid(),
    nome: n,
    lider: members[i % members.length]?.nome ?? "Líder",
    integrantes: 6 + ((i * 7) % 20),
    descricao: `Ministério de ${n}`,
    situacao: "Ativo",
  }));

  const cells: Row[] = cellNames.map((n, i) => ({
    id: uid(),
    nome: n,
    lider: members[i % members.length]?.nome ?? "Líder",
    anfitriao: members[(i + 3) % members.length]?.nome ?? "Anfitrião",
    endereco: `Rua das Palmeiras, ${50 + i * 33}`,
    dia: ["Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"][i],
    hora: ["19:30", "20:00", "19:00", "20:00", "16:00"][i],
    congregacao: congs[i % 3],
    participantes: 8 + ((i * 5) % 12),
    situacao: "Ativa",
  }));

  const transactions: Row[] = [];
  for (let m = 0; m < 6; m++) {
    [["Receita", "Dízimos", 9800], ["Receita", "Ofertas", 3200], ["Receita", "Campanhas", 1500], ["Despesa", "Energia", 890], ["Despesa", "Aluguel", 3500], ["Despesa", "Ação social", 1200], ["Despesa", "Manutenção", 700]].forEach(([tipo, cat, v], j) => {
      transactions.push({
        id: uid(),
        tipo: tipo as string,
        categoria: cat as string,
        descricao: `${cat} do mês`,
        valor: Math.round((v as number) * (0.85 + ((m * 3 + j) % 7) / 20)),
        data: d(-m * 30 - j),
        pagamento: ["PIX", "Dinheiro", "Transferência"][j % 3],
        conta: "Conta principal",
        congregacao: congs[j % 3],
      });
    });
  }

  const contributions: Row[] = Array.from({ length: 14 }, (_, i) => ({
    id: uid(),
    membro: i % 5 === 0 ? "Anônimo" : members[i % members.length]?.nome ?? "Membro",
    tipo: i % 3 ? "Dízimo" : "Oferta",
    valor: 50 + ((i * 73) % 600),
    data: d(-i * 2),
    pagamento: ["PIX", "Dinheiro", "Cartão"][i % 3],
    congregacao: congs[i % 3],
  }));

  const events: Row[] = [
    { id: uid(), titulo: "Culto de Celebração", data: d(3), hora: "19:00", tipo: "Culto", local: "Sede Central", responsavel: "Pr. João Silva" },
    { id: uid(), titulo: "Conferência de Jovens", data: d(10), hora: "15:00", tipo: "Conferência", local: "Sede Central", responsavel: "Gabriel Almeida" },
    { id: uid(), titulo: "Ação Social no Bairro", data: d(17), hora: "09:00", tipo: "Social", local: "Vila Nova", responsavel: "Marta Oliveira" },
    { id: uid(), titulo: "Santa Ceia", data: d(24), hora: "19:30", tipo: "Culto", local: "Todas as congregações", responsavel: "Pr. João Silva" },
    { id: uid(), titulo: "Ensaio do Louvor", data: d(1), hora: "20:00", tipo: "Ensaio", local: "Sede Central", responsavel: "Lucas Barbosa" },
    { id: uid(), titulo: "Escola Bíblica Dominical", data: d(5), hora: "09:00", tipo: "EBD", local: "Todas as congregações", responsavel: "Débora Ferreira" },
    { id: uid(), titulo: "Vigília de Oração", data: d(12), hora: "22:00", tipo: "Vigília", local: "Sede Central", responsavel: "Pr. Marcos Reis" },
    { id: uid(), titulo: "Evangelismo na Praça", data: d(19), hora: "16:00", tipo: "Evangelismo", local: "Praça Central", responsavel: "Tiago Nunes" },
    { id: uid(), titulo: "Reunião de Obreiros", data: d(8), hora: "19:00", tipo: "Reunião", local: "Sede Central", responsavel: "Pr. André Luz" },
  ];

  const appointments: Row[] = [
    { id: uid(), membro: "Carlos Eduardo Lima", person: "Carlos Eduardo Lima", member_id: "m_carlos", data: d(1), hora: "14:00", start_time: "14:00", end_time: "15:00", tipo: "Aconselhamento", motivo: "Aconselhamento familiar", status: "Agendado", location: "Gabinete Pastoral" },
    { id: uid(), membro: "Débora Ferreira", person: "Débora Ferreira", member_id: "m_debora", data: d(2), hora: "10:00", start_time: "10:00", end_time: "11:00", tipo: "Visita", motivo: "Visita pastoral pós-cirúrgica", status: "Agendado", location: "Residência" },
    { id: uid(), membro: "Gabriel Almeida", person: "Gabriel Almeida", member_id: "m_gabriel", data: d(4), hora: "16:30", start_time: "16:30", end_time: "17:30", tipo: "Aconselhamento", motivo: "Orientação vocacional para jovens", status: "Agendado", location: "Gabinete Pastoral" },
    { id: uid(), membro: "Lucas Barbosa", person: "Lucas Barbosa", member_id: "m_lucas", data: d(-1), hora: "19:00", start_time: "19:00", end_time: "20:00", tipo: "Visita", motivo: "Visita e oração", status: "Realizado", location: "Residência" },
    { id: uid(), membro: "Priscila Santos", person: "Priscila Santos", member_id: "m_priscila", data: d(6), hora: "09:30", start_time: "09:30", end_time: "10:30", tipo: "Aconselhamento", motivo: "Aconselhamento pré-nupcial", status: "Agendado", location: "Gabinete Pastoral" },
  ];

  const inventory: Row[] = [
    { id: uid(), nome: "Cadeiras plásticas", categoria: "Mobiliário", quantidade: 220, estado: "Bom", local: "Sede Central", aquisicao: "2021-05-10", valor: 85 },
    { id: uid(), nome: "Mesa de som 16 canais", categoria: "Áudio", quantidade: 1, estado: "Bom", local: "Sede Central", aquisicao: "2019-11-02", valor: 4200 },
    { id: uid(), nome: "Microfones sem fio", categoria: "Áudio", quantidade: 6, estado: "Regular", local: "Sede Central", aquisicao: "2022-03-18", valor: 950 },
    { id: uid(), nome: "Projetor multimídia", categoria: "Audiovisual", quantidade: 2, estado: "Bom", local: "Sede Central", aquisicao: "2023-01-25", valor: 2800 },
    { id: uid(), nome: "Instrumentos musicais (bateria)", categoria: "Instrumentos", quantidade: 1, estado: "Bom", local: "Sede Central", aquisicao: "2020-08-14", valor: 5600 },
    { id: uid(), nome: "Bíblias para EBD", categoria: "Material didático", quantidade: 45, estado: "Regular", local: "Congregação Vila Nova", aquisicao: "2022-07-30", valor: 60 },
    { id: uid(), nome: "Ar-condicionado 24.000 BTU", categoria: "Climatização", quantidade: 4, estado: "Bom", local: "Sede Central", aquisicao: "2021-12-05", valor: 3900 },
    { id: uid(), nome: "Computador da secretaria", categoria: "Informática", quantidade: 2, estado: "Regular", local: "Sede Central", aquisicao: "2020-02-20", valor: 3200 },
    { id: uid(), nome: "Cadeiras de madeira", categoria: "Mobiliário", quantidade: 60, estado: "Regular", local: "Congregação Jardim Esperança", aquisicao: "2018-06-11", valor: 120 },
    { id: uid(), nome: "Caixas de som ativas", categoria: "Áudio", quantidade: 4, estado: "Bom", local: "Congregação Vila Nova", aquisicao: "2023-09-08", valor: 1800 },
  ];

  return {
    members,
    congregations,
    departments,
    cells,
    transactions,
    contributions,
    events,
    appointments,
    inventory,
    pastor_series,
    pastor_sermons,
    pastor_insights,
    pastoral_requests,
    audit: [],
  };
}

/**
 * Retorna uma base de dados completamente limpa (coleções vazias) para testes.
 */
export function emptyDB(): DB {
  return {
    members: [],
    congregations: [],
    departments: [],
    cells: [],
    transactions: [],
    contributions: [],
    events: [],
    appointments: [],
    inventory: [],
    pastor_series: [],
    pastor_sermons: [],
    pastor_insights: [],
    pastoral_requests: [],
    audit: [],
  };
}

const KEY = "ecclesia-db-v6";

type Ctx = {
  db: DB;
  create: (c: Collection, row: Omit<Row, "id">) => Row;
  update: (c: Collection, row: Row) => void;
  remove: (c: Collection, id: string) => void;
  clearAll: () => void;
  loadDemoData: () => void;
};
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  // Inicializa limpo para testes com dados reais
  const [db, setDb] = useState<DB>(emptyDB);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Limpa versões anteriores de cache com mock para garantir teste limpo
    try {
      localStorage.removeItem("ecclesia-db-v5");
      localStorage.removeItem("ecclesia-db-v4");
      localStorage.removeItem("ecclesia-db-v3");
      localStorage.removeItem("ecclesia-db-v2");
      localStorage.removeItem("ecclesia-db");
    } catch {
      /* ignore */
    }

    const raw = localStorage.getItem(KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const initial = emptyDB();
        const merged = { ...initial, ...parsed };
        setDb(merged);
      } catch {
        setDb(emptyDB());
      }
    } else {
      setDb(emptyDB());
      try {
        localStorage.setItem(KEY, JSON.stringify(emptyDB()));
      } catch {
        /* ignore */
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(db));
  }, [db, ready]);

  const log = (c: Collection, action: AuditEntry["action"], row: Row): AuditEntry => ({
    id: uid(),
    at: new Date().toISOString(),
    collection: c,
    action,
    label: String(row.nome ?? row.titulo ?? row.title ?? row.descricao ?? row.membro ?? row.person ?? row.id),
  });

  const value: Ctx = {
    db,
    create: (c, row) => {
      const r = { ...row, id: uid() } as Row;
      setDb((s) => ({
        ...s,
        [c]: [r, ...(s[c] || [])],
        audit: [log(c, "criação", r), ...s.audit],
      }));
      return r;
    },
    update: (c, row) =>
      setDb((s) => ({
        ...s,
        [c]: (s[c] || []).map((r) => (r.id === row.id ? row : r)),
        audit: [log(c, "edição", row), ...s.audit],
      })),
    remove: (c, id) =>
      setDb((s) => {
        const r = (s[c] || []).find((x) => x.id === id);
        if (!r) return s;
        return {
          ...s,
          [c]: (s[c] || []).filter((x) => x.id !== id),
          audit: [log(c, "exclusão", r), ...s.audit],
        };
      }),
    clearAll: () => {
      const clean = emptyDB();
      setDb(clean);
      try {
        localStorage.setItem(KEY, JSON.stringify(clean));
      } catch {
        /* ignore */
      }
    },
    loadDemoData: () => {
      const demo = seed();
      setDb(demo);
      try {
        localStorage.setItem(KEY, JSON.stringify(demo));
      } catch {
        /* ignore */
      }
    },
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("StoreProvider ausente");
  return c;
}

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtDate = (s?: string | number) => (s ? new Date(String(s) + "T12:00:00").toLocaleDateString("pt-BR") : "—");

/**
 * Exporta para CSV com suporte a acentuação UTF-8 nativa para Excel (\uFEFF BOM)
 */
export function exportCSV(filename: string, rows: Row[], cols: { key: string; label: string }[]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csvContent =
    "\uFEFF" +
    [
      cols.map((c) => esc(c.label)).join(";"),
      ...rows.map((r) => cols.map((c) => esc(r[c.key])).join(";")),
    ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
