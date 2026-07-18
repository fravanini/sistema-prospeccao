// Catálogo de nichos: cada nicho adapta o app inteiro — categorias de marca
// (ICP), hashtags para o garimpo de publis, fontes de pesquisa e dicas de
// gancho. Para tornar o produto vendável a qualquer criador, basta evoluir
// este catálogo (e, no futuro, permitir nichos criados pelo usuário).

export interface Nicho {
  id: string;
  nome: string;
  descricao: string;
  categorias: string[];
  hashtags: string[];
  tiposDeMarca: string[];
  ondePesquisar: string[];
  ganchoDicas: string[];
}

export const CATEGORIAS_GENERICAS = [
  "Moda e acessórios",
  "Beleza e cuidados",
  "Alimentos e bebidas",
  "Saúde e bem-estar",
  "Tecnologia",
  "Educação e cursos",
  "Serviços e apps",
  "Casa e decoração",
  "Viagem e lazer",
  "Financeiro",
  "Outra",
];

export const NICHOS: Nicho[] = [
  {
    id: "geral",
    nome: "Geral / Personalizado",
    descricao: "Base neutra para qualquer nicho — personalize as categorias conforme for usando.",
    categorias: CATEGORIAS_GENERICAS,
    hashtags: ["publi", "publipost", "parceria"],
    tiposDeMarca: [
      "Marcas que já fazem publi com criadores do seu tamanho",
      "E-commerces do seu tema com perfil ativo no Instagram",
      "Apps e serviços que seu público usa",
    ],
    ondePesquisar: [
      "Publis de 20-30 criadores do seu nicho (10k-200k): anote as marcas marcadas",
      "Biblioteca de Anúncios da Meta com termos do seu tema",
      "Marcas que seguem, comentam ou respondem seus stories",
      "Google Shopping e marketplaces na categoria do seu conteúdo",
    ],
    ganchoDicas: [
      "Lançamento recente de produto ou coleção",
      "Campanha ou publi que a marca fez com outro criador",
      "Encaixe concreto entre um produto e um conteúdo seu já planejado",
    ],
  },
  {
    id: "viagem-outdoor",
    nome: "Viagem & Outdoor",
    descricao: "Viagem de aventura, vida outdoor, trilha, camping e nomadismo digital.",
    categorias: [
      "Equipamento outdoor",
      "Vestuário técnico",
      "Calçados",
      "Viagem / Turismo",
      "Hospedagem",
      "Apps de trilha / viagem",
      "Seguro viagem",
      "Chip / eSIM",
      "Banco digital / Cartão",
      "VPN / Software",
      "Coworking",
      "Suplementos / Nutrição",
      "Alimentos e bebidas",
      "Câmeras / Eletrônicos",
      "Outra",
    ],
    hashtags: ["publi", "trekkingbrasil", "mochilao", "nomadedigital"],
    tiposDeMarca: [
      "Mochilas, barracas e equipamento de trilha",
      "Roupas técnicas e calçados de trekking",
      "Agências de ecoturismo, operadoras de expedição, hostels",
      "Seguro viagem, eSIM, bancos sem IOF, VPN (pagam bem e em recorrência)",
      "Câmeras de ação, drones e acessórios",
    ],
    ondePesquisar: [
      "Publis de criadores de trilha/mochilão: as marcas de equipamento repetem muito",
      "Biblioteca de Anúncios da Meta: 'trekking', 'seguro viagem', 'eSIM', 'camping'",
      "Feiras do setor (Adventure Sports Fair) e associações (ABETA)",
      "Programas de embaixadores nos sites das marcas outdoor — muitas têm formulário próprio",
    ],
    ganchoDicas: [
      "Linha nova de equipamento (mochila, barraca, bota) que você pode testar em campo",
      "Destino que a marca patrocina ou onde roda campanha",
      "Sua próxima expedição como oportunidade de conteúdo em uso real",
    ],
  },
  {
    id: "fitness",
    nome: "Fitness & Saúde",
    descricao: "Treino, musculação, corrida, bem-estar e nutrição esportiva.",
    categorias: [
      "Suplementos",
      "Roupas fitness",
      "Tênis / Calçados",
      "Academias / Estúdios",
      "Apps de treino / Saúde",
      "Acessórios de treino",
      "Alimentação saudável",
      "Wearables / Eletrônicos",
      "Clínicas / Estética",
      "Outra",
    ],
    hashtags: ["publi", "fitnessbrasil", "vidasaudavel", "maromba"],
    tiposDeMarca: [
      "Suplementos (whey, creatina, pré-treino) — os maiores compradores de publi do nicho",
      "Moda fitness e tênis de performance",
      "Apps de treino/dieta e wearables",
      "Marmitas fit, snacks proteicos e bebidas funcionais",
    ],
    ondePesquisar: [
      "Cupons de desconto de outros criadores fitness: cada cupom é uma marca compradora",
      "Biblioteca de Anúncios: 'whey', 'creatina', 'marmita fit', 'app de treino'",
      "Prateleiras de lojas de suplemento online: marcas médias disputando espaço",
    ],
    ganchoDicas: [
      "Lançamento de sabor/linha nova de suplemento",
      "Atleta ou criador que a marca acabou de patrocinar",
      "Seu resultado ou rotina real usando o tipo de produto da marca",
    ],
  },
  {
    id: "moda-beleza",
    nome: "Moda & Beleza",
    descricao: "Looks, styling, skincare, maquiagem e cuidados pessoais.",
    categorias: [
      "Moda feminina / masculina",
      "Acessórios / Joias",
      "Calçados",
      "Skincare",
      "Maquiagem",
      "Cabelos",
      "Perfumaria",
      "Óticas / Óculos",
      "E-commerce de moda",
      "Outra",
    ],
    hashtags: ["publi", "modabrasil", "skincareroutine", "lookdodia"],
    tiposDeMarca: [
      "Marcas de skincare e maquiagem nacionais (investem pesado em criadores médios)",
      "E-commerces e marcas autorais de moda",
      "Perfumaria e cuidados pessoais",
      "Joias, semijoias e acessórios",
    ],
    ondePesquisar: [
      "Recebidos (#recebidos) de criadoras do nicho: marcas que enviam PR kit compram publi",
      "Biblioteca de Anúncios: 'skincare', 'semijoias', 'moda feminina'",
      "Lançamentos em perfumarias online e marketplaces de beleza",
    ],
    ganchoDicas: [
      "Coleção ou drop recém-lançado",
      "Produto viral da marca no momento",
      "Proposta de editorial/try-on com a identidade do seu feed",
    ],
  },
  {
    id: "gastronomia",
    nome: "Gastronomia",
    descricao: "Receitas, restaurantes, cafés, bebidas e experiências gastronômicas.",
    categorias: [
      "Restaurantes / Bares",
      "Cafés / Cafeterias",
      "Bebidas",
      "Alimentos / Ingredientes",
      "Utensílios de cozinha",
      "Eletroportáteis",
      "Delivery / Apps",
      "Cursos de gastronomia",
      "Outra",
    ],
    hashtags: ["publi", "gastronomia", "receitasfaceis", "cafeteria"],
    tiposDeMarca: [
      "Restaurantes e cafés da sua cidade (permuta + cachê para conteúdo local)",
      "Marcas de ingredientes, cafés especiais e bebidas artesanais",
      "Utensílios, panelas e eletroportáteis (air fryer é publi perene)",
      "Apps de delivery e reservas",
    ],
    ondePesquisar: [
      "Inaugurações e novos cardápios na sua cidade — o momento em que restaurante compra mídia",
      "Biblioteca de Anúncios: 'café especial', 'air fryer', nomes de bairros gastronômicos",
      "Marcas nas publis de outros criadores de comida da sua região",
    ],
    ganchoDicas: [
      "Prato/produto novo no cardápio ou lançamento sazonal",
      "Sua receita que se encaixa com o ingrediente da marca",
      "Números de audiência local (restaurantes pagam por público da região)",
    ],
  },
  {
    id: "tech-games",
    nome: "Tech & Games",
    descricao: "Reviews de eletrônicos, setup, hardware, apps e games.",
    categorias: [
      "Eletrônicos / Gadgets",
      "Periféricos / Setup",
      "Hardware",
      "Games / Estúdios",
      "Apps / Software",
      "Operadoras / Internet",
      "E-commerce de tech",
      "Cursos de tecnologia",
      "Outra",
    ],
    hashtags: ["publi", "setupgamer", "techbrasil", "review"],
    tiposDeMarca: [
      "Periféricos (teclado, mouse, headset) e cadeiras gamer",
      "Acessórios de celular, carregadores, capas",
      "Apps, VPNs e software (pagam recorrente por criador de tech)",
      "Lojas de eletrônicos e importadoras",
    ],
    ondePesquisar: [
      "Reviews patrocinados de canais médios do nicho: as mesmas marcas patrocinam em série",
      "Biblioteca de Anúncios: 'teclado mecânico', 'cadeira gamer', 'VPN'",
      "Lançamentos de marcas chinesas entrando no Brasil — buscam criadores para validação",
    ],
    ganchoDicas: [
      "Produto recém-lançado que você pode rever de forma independente",
      "Comparativo que seu público pede e encaixa o produto da marca",
      "Setup/unboxing com estética do seu feed",
    ],
  },
  {
    id: "financas",
    nome: "Finanças & Carreira",
    descricao: "Educação financeira, investimentos, renda extra e desenvolvimento profissional.",
    categorias: [
      "Bancos digitais / Cartões",
      "Corretoras / Investimentos",
      "Fintechs / Apps",
      "Cursos / Educação",
      "Seguros",
      "Contabilidade / Serviços PJ",
      "Livros / Editoras",
      "Outra",
    ],
    hashtags: ["publi", "educacaofinanceira", "investimentos", "rendaextra"],
    tiposDeMarca: [
      "Bancos digitais, cartões e corretoras (maiores cachês do mercado de publi)",
      "Fintechs de crédito, câmbio e pagamentos",
      "Plataformas de cursos e escolas de negócios",
      "Contabilidades online para MEI/PJ",
    ],
    ondePesquisar: [
      "Publis de criadores de finanças: bancos e corretoras rodam campanhas contínuas",
      "Biblioteca de Anúncios: 'cartão de crédito', 'corretora', 'conta PJ'",
      "Programas de afiliados das fintechs — porta de entrada para contrato de publi",
    ],
    ganchoDicas: [
      "Produto financeiro novo (cartão, conta, fundo) para explicar ao seu público",
      "Tema em alta (IPO, selic, imposto de renda) que conecta com a marca",
      "Compliance: mostre que você comunica riscos corretamente — marcas do setor exigem",
    ],
  },
  {
    id: "maternidade",
    nome: "Maternidade & Família",
    descricao: "Gestação, bebês, rotina com filhos e vida em família.",
    categorias: [
      "Produtos infantis",
      "Fraldas / Higiene",
      "Alimentação infantil",
      "Brinquedos / Educativos",
      "Moda infantil / Gestante",
      "Saúde / Clínicas",
      "Apps / Serviços familiares",
      "Móveis / Quarto de bebê",
      "Outra",
    ],
    hashtags: ["publi", "maternidadereal", "maedeprimeiraviagem", "vidademae"],
    tiposDeMarca: [
      "Fraldas, higiene e cuidados com o bebê (campanhas recorrentes e longas)",
      "Brinquedos educativos e enxoval",
      "Moda infantil e gestante",
      "Apps de acompanhamento, planos de saúde e escolas",
    ],
    ondePesquisar: [
      "Publis de outras mães criadoras: o nicho tem alta recompra de campanhas",
      "Biblioteca de Anúncios: 'fralda', 'enxoval', 'brinquedo educativo'",
      "Lojas de departamento infantil e marcas D2C de puericultura",
    ],
    ganchoDicas: [
      "Fase do seu filho que casa com o produto (introdução alimentar, desfralde...)",
      "Rotina real — o nicho valoriza autenticidade acima de produção",
      "Datas fortes: Dia das Crianças, volta às aulas, Natal",
    ],
  },
  {
    id: "pets",
    nome: "Pets",
    descricao: "Cachorros, gatos e a vida com animais de estimação.",
    categorias: [
      "Ração / Petiscos",
      "Acessórios pet",
      "Higiene / Saúde animal",
      "Planos de saúde pet",
      "Pet shops / E-commerce",
      "Apps / Serviços pet",
      "Hotéis / Creches pet",
      "Outra",
    ],
    hashtags: ["publi", "petsbrasil", "cachorrosdoinstagram", "gatosdoinstagram"],
    tiposDeMarca: [
      "Rações premium e petiscos naturais (publi perene do nicho)",
      "Acessórios, camas, brinquedos e roupas pet",
      "Planos de saúde e telemedicina veterinária",
      "Apps de passeio, adestramento e pet sitter",
    ],
    ondePesquisar: [
      "Perfis pet famosos: as marcas das publis deles compram de criadores menores também",
      "Biblioteca de Anúncios: 'ração premium', 'plano de saúde pet', 'petisco natural'",
      "Pet shops online e marcas D2C de assinatura de ração",
    ],
    ganchoDicas: [
      "Transição de alimentação ou fase do seu pet",
      "Conteúdo de reação/rotina que viraliza com o produto em cena",
      "Assinaturas: proponha acompanhamento de longo prazo, não post único",
    ],
  },
  {
    id: "casa-decor",
    nome: "Casa & Decoração",
    descricao: "Décor, organização, reforma, DIY e vida doméstica.",
    categorias: [
      "Móveis / Decoração",
      "Organização / Utilidades",
      "Eletrodomésticos",
      "Cama, mesa e banho",
      "Tintas / Reforma",
      "Plantas / Jardinagem",
      "E-commerce de casa",
      "Imobiliárias / Construtoras",
      "Outra",
    ],
    hashtags: ["publi", "decoracao", "organizacao", "minhacasa"],
    tiposDeMarca: [
      "Móveis, decoração e utilidades domésticas",
      "Eletrodomésticos e eletroportáteis",
      "Marcas de organização (potes, cabides, nichos) — nicho fortíssimo em vídeo",
      "Tintas, papel de parede e materiais de reforma",
    ],
    ondePesquisar: [
      "Antes/depois de outros criadores: as marcas de reforma e décor aparecem nos créditos",
      "Biblioteca de Anúncios: 'organizador', 'sofá', 'papel de parede'",
      "E-commerces de casa em datas fortes (Casa Nova, Black Friday)",
    ],
    ganchoDicas: [
      "Seu próximo projeto de cômodo como oportunidade de before/after",
      "Produto da marca que resolve uma dor visível do seu espaço",
      "Conteúdo de organização com resultado mensurável (gaveta, despensa...)",
    ],
  },
  {
    id: "educacao",
    nome: "Educação & Idiomas",
    descricao: "Estudos, concursos, idiomas, produtividade e aprendizado.",
    categorias: [
      "Cursos online",
      "Escolas de idiomas",
      "Apps de estudo",
      "Livros / Editoras",
      "Material / Papelaria",
      "Intercâmbio",
      "Faculdades / Pós",
      "Outra",
    ],
    hashtags: ["publi", "estudos", "concurseiro", "aprenderingles"],
    tiposDeMarca: [
      "Apps de idiomas e plataformas de curso (orçamento constante para criadores)",
      "Editoras e clubes de livro",
      "Papelaria, planners e materiais de estudo",
      "Agências de intercâmbio e faculdades EAD",
    ],
    ondePesquisar: [
      "Publis de studygrams e criadores de produtividade",
      "Biblioteca de Anúncios: 'curso de inglês', 'EAD', 'intercâmbio'",
      "Lançamentos de editoras e temporadas de matrícula/vestibular",
    ],
    ganchoDicas: [
      "Sua rotina de estudo real usando o método/app da marca",
      "Época de matrícula, ENEM ou concursos como janela de campanha",
      "Resultado concreto seu ou da audiência com o tipo de produto",
    ],
  },
];

export const NICHO_PADRAO_ID = "geral";

export function nichoPorId(id?: string | null): Nicho {
  return NICHOS.find((n) => n.id === id) ?? NICHOS.find((n) => n.id === NICHO_PADRAO_ID)!;
}
