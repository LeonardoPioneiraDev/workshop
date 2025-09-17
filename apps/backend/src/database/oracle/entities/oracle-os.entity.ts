// src/database/oracle/entities/oracle-os.entity.ts
import { ViewEntity, Column, PrimaryColumn } from 'typeorm';

// Importante: Substitua 'NOME_DA_SUA_TABELA_OU_VIEW_NO_ORACLE' pelo nome REAL
// da tabela ou view que você está consultando no seu banco de dados Oracle.
// Ex: 'SUA_TABELA_DE_OS' ou 'VW_ORDENS_SERVICO'.
@ViewEntity({ name: 'NOME_DA_SUA_TABELA_OU_VIEW_NO_ORACLE' })
export class OracleOS {
  // Mapeie as colunas do seu banco de dados Oracle para propriedades TypeScript.
  // Os nomes em 'name' devem ser as colunas EXATAS do Oracle.
  // Os tipos (number, string, Date) devem corresponder ao que você espera do TypeORM.
  // Use @PrimaryColumn para uma chave primária (ou única) que o TypeORM possa usar.

  @PrimaryColumn({ name: 'CODINTOS' })
  codIntOS: number; // Exemplo: Código Interno da OS

  @Column({ name: 'NUMEROOS' })
  numeroOS: number; // Exemplo: Número da OS

  @Column({ name: 'DATAABERTURAOS', type: 'timestamp with time zone' }) // Ajuste o tipo 'timestamp with time zone' se necessário
  dataAberturaOS: Date; // Exemplo: Data de Abertura da OS

  @Column({ name: 'KMEXECUCAOOS' })
  kmExecucaoOS: number; // Exemplo: Quilometragem da Execução

  @Column({ name: 'USUARIOABERTURAOS' })
  usuarioAberturaOS: string; // Exemplo: Usuário que abriu a OS

  // Adicione **TODAS** as outras colunas da sua consulta SQL (do oracle.controller.ts) aqui.
  // Exemplo:
  // @Column({ name: 'CODIGOEMPRESA' })
  // codigoEmpresa: number;
  // @Column({ name: 'TIPOOS' })
  // tipoOS: string;
  // ... e assim por diante para todos os campos que você usa no SELECT ...
}