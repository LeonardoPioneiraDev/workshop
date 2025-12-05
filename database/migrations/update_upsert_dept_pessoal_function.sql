-- SQL CORRIGIDO para atualizar a função upsert_dept_pessoal_snapshot
-- Este script corrige os nomes das colunas que têm underscores

-- 1. Dropar a função antiga
DROP FUNCTION IF EXISTS workshop.upsert_dept_pessoal_snapshot(
    int, int, date, text, text, text, text, text, text, text, text, date, text,
    numeric, numeric, numeric, date, text, date, int, int, numeric, text, date,
    text, text, text, text, text, text, text, text, date, text, text
);

-- 2. Criar a nova função com nomes de colunas corretos
CREATE OR REPLACE FUNCTION workshop.upsert_dept_pessoal_snapshot(
    p_empresa int,
    p_codintfunc int,
    p_referencia_date date,
    p_cracha text,
    p_chapa text,
    p_nome text,
    p_cpf text,
    p_funcao text,
    p_departamento text,
    p_area text,
    p_cidade text,
    p_admissao date,
    p_situacao text,
    p_salbase numeric,
    p_salaux1 numeric,
    p_salaux2 numeric,
    p_dtcompet_quita date,
    p_id_quita text,
    p_dt_deslig_quita date,
    p_idade int,
    p_tempo_empresa_dias int,
    p_tempo_empresa_anos numeric,
    p_valerefeicfunc text,
    p_dttransffunc date,
    p_mae text,
    p_descsecao text,
    p_descsetor text,
    p_endereco text,
    p_casa text,
    p_bairro text,
    p_fonefunc text,
    p_fone2func text,
    p_data_afastamento date,
    p_cid_medico text,
    p_descricao_cid text
)
RETURNS void AS $$
BEGIN
    INSERT INTO workshop.dept_pessoal_snapshot (
        empresa, codintfunc, referencia_date, cracha, chapa, nome, cpf, funcao,
        departamento, area, cidade, admissao, situacao, salbase, salaux1, salaux2,
        dtcompet_quita, id_quita, dt_deslig_quita, idade, tempo_empresa_dias, tempo_empresa_anos,
        valerefeicfunc, dttransffunc, mae, descsecao, descsetor, endereco, casa, bairro,
        fonefunc, fone2func, data_afastamento, cid_medico, descricao_cid
    ) VALUES (
        p_empresa, p_codintfunc, p_referencia_date, p_cracha, p_chapa, p_nome, p_cpf, p_funcao,
        p_departamento, p_area, p_cidade, p_admissao, p_situacao, p_salbase, p_salaux1, p_salaux2,
        p_dtcompet_quita, p_id_quita, p_dt_deslig_quita, p_idade, p_tempo_empresa_dias, p_tempo_empresa_anos,
        p_valerefeicfunc, p_dttransffunc, p_mae, p_descsecao, p_descsetor, p_endereco, p_casa, p_bairro,
        p_fonefunc, p_fone2func, p_data_afastamento, p_cid_medico, p_descricao_cid
    )
    ON CONFLICT (empresa, codintfunc, referencia_date)
    DO UPDATE SET
        cracha = EXCLUDED.cracha,
        chapa = EXCLUDED.chapa,
        nome = EXCLUDED.nome,
        cpf = EXCLUDED.cpf,
        funcao = EXCLUDED.funcao,
        departamento = EXCLUDED.departamento,
        area = EXCLUDED.area,
        cidade = EXCLUDED.cidade,
        admissao = EXCLUDED.admissao,
        situacao = EXCLUDED.situacao,
        salbase = EXCLUDED.salbase,
        salaux1 = EXCLUDED.salaux1,
        salaux2 = EXCLUDED.salaux2,
        dtcompet_quita = EXCLUDED.dtcompet_quita,
        id_quita = EXCLUDED.id_quita,
        dt_deslig_quita = EXCLUDED.dt_deslig_quita,
        idade = EXCLUDED.idade,
        tempo_empresa_dias = EXCLUDED.tempo_empresa_dias,
        tempo_empresa_anos = EXCLUDED.tempo_empresa_anos,
        valerefeicfunc = EXCLUDED.valerefeicfunc,
        dttransffunc = EXCLUDED.dttransffunc,
        mae = EXCLUDED.mae,
        descsecao = EXCLUDED.descsecao,
        descsetor = EXCLUDED.descsetor,
        endereco = EXCLUDED.endereco,
        casa = EXCLUDED.casa,
        bairro = EXCLUDED.bairro,
        fonefunc = EXCLUDED.fonefunc,
        fone2func = EXCLUDED.fone2func,
        data_afastamento = EXCLUDED.data_afastamento,
        cid_medico = EXCLUDED.cid_medico,
        descricao_cid = EXCLUDED.descricao_cid;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION workshop.upsert_dept_pessoal_snapshot IS 'Insere ou atualiza snapshot de funcionário do departamento pessoal com informações de afastamento e CID';
