// src/utils/setorUtils.ts

export interface ViagemData {
  NomePI?: string;
  NomePF?: string;
  // Outras propriedades podem ser adicionadas aqui
}

export const mapearSetor = (item: ViagemData): string => {
  const origem = (item?.NomePI ?? '').toLowerCase();
  const destino = (item?.NomePF ?? '').toLowerCase();

  const setoresMapeados: { [key: string]: string } = {
    'terminal paranoá': 'Paranoá',
    'terminal são sebastiao': 'São Sebastião',
    'terminal gama sul': 'Gama',
    'ter brt sm': 'Santa Maria',
  };

  // Verificação por mapeamento direto
  for (const chave in setoresMapeados) {
    if (origem.includes(chave) || destino.includes(chave)) {
      return setoresMapeados[chave];
    }
  }

  // Casos específicos para Paranoá
  if (
    origem.includes('terminal do itapoã') ||
    destino.includes('terminal do itapoã') ||
    origem.includes('circular paranoá') ||
    destino.includes('circular paranoá') ||
    origem.includes('circular paranoá - 1') ||
    destino.includes('circular paranoá - 1') ||
    destino.includes('ponto de preparo saan chegada') ||
    origem.includes('circular terminal itapoã 1') ||
    destino.includes('circular terminal itapoã 1') ||
    destino.includes('gar. itapoã') ||
    origem.includes('gar. itapoã') ||
    origem.includes('circular terminal itapoã 2') ||
    destino.includes('circular terminal itapoã 2') ||
    origem.includes('circular rodoviária plano 1') ||
    destino.includes('circular rodoviária plano 2') ||
    origem.includes('adm cand. 163') ||
    destino.includes('adm cand. 163') ||
    origem.includes('terminal do paranoá') ||
    destino.includes('terminal do paranoá') ||
    origem.includes('terminal do paranoa') ||
    destino.includes('terminal do paranoa') ||
    destino.includes('novo ponto de controle w3 norte') ||
    origem.includes('terminal paranoa') ||
    destino.includes('terminal paranoa') ||
    origem.includes('circular itapoã') ||
    destino.includes('circular itapoã') ||
    origem.includes('controle circular asa norte 2') ||
    destino.includes('controle circular asa norte 2') ||
    origem.includes('novo ponto circular asa norte') ||
    destino.includes('novo ponto circular asa norte') ||
    origem.includes('paranoá circular rodoviária plano 1') ||
    destino.includes('ponto de controle águas claras') ||
    origem.includes('terminal do cruzeiro') ||
    destino.includes('terminal do cruzeiro')
  ) {
    return 'Paranoá';
  }

  // Casos específicos para Gama
  if (
    destino.includes('novo ponto brt gama') ||
    destino.includes('novo ponto brt gama teste ponto final') ||
    origem.includes('novo ponto brt gama teste ponto final') ||
    origem.includes('ponto ter sul') ||
    destino.includes('ponto ter sul') ||
    origem.includes('terminal integração brt - gama') ||
    destino.includes('terminal integração brt - gama') ||
    origem.includes('circular brt gama 1') ||
    destino.includes('circular brt gama 1') ||
    origem.includes('circular brt gama 2') ||
    destino.includes('circular brt gama 2') ||
    origem.includes('ponto de controle terminal rodoviário do gama') ||
    destino.includes('ponto de controle terminal rodoviário do gama') ||
    origem.includes('engenho das lages') ||
    destino.includes('engenho das lages') ||
    origem.includes('ponto saída 073.1') ||
    destino.includes('estação metro - asa sul') ||
    origem.includes('novo ponto 073.2') ||
    destino.includes('novo ponto 073.2') ||
    destino.includes('novo ponto 073.3') ||
    origem.includes('terminal setor "o"') ||
    destino.includes('terminal setor "o"') ||
    origem.includes('terminal do gama') || 
    origem.includes('circular park way 3') ||
    destino.includes('terminal do gama') ||
    destino.includes('novo ponto 3204') ||
    destino.includes('novo ponto 3207') ||
    destino.includes('circular park way / aeroporto 2') ||
    origem.includes('circular park way / aeroporto 2') ||
    origem.includes('terminal gama') ||
    destino.includes('terminal gama')     
  ) {
    return 'Gama';
  }

  // Casos específicos para São Sebastião
  if (
    destino.includes('circular ss') ||
    origem.includes('circular ss') ||
    destino.includes('circular ss 2') ||
    origem.includes('circular ss 2') ||
    origem.includes('p, controle - mangueiral 2') ||
    destino.includes('p, controle - mangueiral 2') ||
    destino.includes('ponto de controle - terminal n. bandeirante') ||
    destino.includes('cond. ouro vermelho') ||
    origem.includes('cond. ouro vermelho') ||
    destino.includes('p. preparo mangueiral') ||
    origem.includes('p. preparo mangueiral') ||
    destino.includes('rpp circular 1') ||
    origem.includes('rpp circular 2') ||
    destino.includes('ponto de controle 160.3') ||
    origem.includes('ponto de controle 160.3') ||
    destino.includes('terminal barreiros') ||
    origem.includes('terminal barreiros') ||
    destino.includes('terminal do guará') ||
    origem.includes('terminal do guará') ||
    destino.includes('terminal guara') ||
    origem.includes('terminal guara') ||
    origem.includes('p. controle - mangueiral 2') ||
    origem.includes('ponto de preparo circulares - jardim abc') ||
    destino.includes('ponto de preparo circulares - jardim abc') ||
    origem.includes('ponto saída 119.0')
  ) {
    return 'São Sebastião';
  }

  // Casos específicos para Santa Maria
  if (
    origem.includes('brt sm ') ||
    destino.includes('brt sm ') ||
    origem.includes('controle circular brt sm 2') ||
    destino.includes('controle circular brt sm 2') ||
    (origem.includes('circular 3301 1') && destino.includes('circular 3301 2')) ||
    (origem.includes('circular 3301 2') && destino.includes('circular 3301 1')) ||
    origem.includes('santa maria ponto de controle - terminal brt de santa maria') ||
    destino.includes('santa maria ponto de controle - terminal brt de santa maria') ||
    origem.includes('novo ponto 2303 brt santa maria') ||
    origem.includes('p. controle ( sudoeste - 247 )') ||
    destino.includes('novo ponto 2303 brt santa maria') ||
    origem.includes('ponto de controle linha 3310') ||
    destino.includes('ponto de controle linha 3310') ||
    origem.includes('terminal de integração brt - santa maria') ||
    destino.includes('terminal de integração brt - santa maria') ||
    origem.includes('ponto saída 073.3') ||
    destino.includes('ponto saída 073.3') ||
    origem.includes('ponto 073.3') ||
    destino.includes('ponto 073.3') ||
    destino.includes('w3 sul - pátio brasil') ||
    origem.includes('ponto de controle - terminal brt de santa maria') ||
    destino.includes('ponto de controle - terminal brt de santa maria') ||
    origem.includes('124.6 saída') ||
    destino.includes('124.6') ||
    origem.includes('terminal de santa maria') ||
    destino.includes('terminal de santa maria') ||
    destino.includes('ponto de controle linha 3310') ||
    origem.includes('ponto de controle 3315') ||
    destino.includes('ponto de controle 2307') ||
    origem.includes('ponto de saída') ||
    origem.includes('BRT SM ') ||
    origem.includes('w3 sul - pátio brasil') ||
    origem.includes('circular park way 1.1') ||
    destino.includes('circular park way 2') ||
    origem.includes('circular park way 2') ||
    destino.includes('w3 sul - pátio brasil')
  ) {
    return 'Santa Maria';
  }

  // Casos específicos para Outros
  if (
    origem.includes('rodoviária do plano piloto') ||
    destino.includes('rodoviária do plano piloto')
  ) {
    return 'Outros';
  }

 // console.log('Sem correspondência para origem:', origem, 'destino:', destino);
  return 'Outro';
};